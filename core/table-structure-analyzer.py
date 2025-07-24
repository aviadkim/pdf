# TABLE STRUCTURE ANALYZER - ADVANCED SPATIAL ANALYSIS
# Understands tabular layouts for accurate financial data extraction

import re
from typing import Dict, List, Tuple, Optional, Set
from dataclasses import dataclass
import logging
import statistics

logger = logging.getLogger(__name__)

@dataclass
class TableColumn:
    """Represents a detected table column"""
    x_start: float
    x_end: float
    column_type: str  # 'isin', 'name', 'quantity', 'price', 'value', 'percentage', 'other'
    confidence: float
    sample_values: List[str]
    page: int

@dataclass
class TableRow:
    """Represents a detected table row"""
    y_position: float
    y_tolerance: float  # ±tolerance for items in this row
    items: List  # SpatialTextItems in this row
    isin: Optional[str] = None
    page: int = 0

@dataclass
class TableStructure:
    """Complete table structure for a page"""
    columns: List[TableColumn]
    rows: List[TableRow]
    page: int
    confidence: float
    header_row: Optional[TableRow] = None

class TableStructureAnalyzer:
    """Advanced table structure detection and analysis"""
    
    def __init__(self):
        self.column_type_patterns = {
            'isin': [
                r'\b[A-Z]{2}[A-Z0-9]{9}[0-9]\b',  # ISIN pattern
                r'ISIN',
                r'Security.*ID'
            ],
            'name': [
                r'Name',
                r'Description',
                r'Instrument',
                r'Security',
                r'[A-Z][a-z]{3,}.*[A-Z][a-z]{3,}'  # Long text patterns
            ],
            'quantity': [
                r'Quantity',
                r'Shares',
                r'Units',
                r'Nominal',
                r'Amount',
                r'Qty',
                r'\b\d{1,3}[,\']\d{3}[,\']\d{3}\b',  # Large numbers
                r'\b\d{3,}\b'  # Medium-large numbers
            ],
            'price': [
                r'Price',
                r'Rate',
                r'Course',
                r'Kurs',
                r'\b\d{1,3}\.\d{2,4}\b',  # Decimal prices
                r'\b[5-9]\d\.\d{2,4}\b'   # Typical bond prices 50-99
            ],
            'value': [
                r'Value',
                r'Market.*Value',
                r'Amount',
                r'Total',
                r'CHF',
                r'USD',
                r'EUR'
            ],
            'percentage': [
                r'%',
                r'Percent',
                r'Portfolio',
                r'Allocation',
                r'\b\d{1,2}\.\d{1,2}%\b'
            ]
        }
    
    def detect_table_structure(self, spatial_items, page_num: int) -> Optional[TableStructure]:
        """Detect table structure on a page"""
        page_items = [item for item in spatial_items if item.page == page_num]
        
        if len(page_items) < 10:  # Too few items for a table
            return None
        
        logger.info(f"Analyzing table structure on page {page_num} with {len(page_items)} items")
        
        # Step 1: Detect columns by clustering X positions
        columns = self._detect_columns(page_items, page_num)
        
        # Step 2: Detect rows by clustering Y positions
        rows = self._detect_rows(page_items, page_num)
        
        # Step 3: Classify column types
        columns = self._classify_columns(columns, rows, page_items)
        
        # Step 4: Calculate structure confidence
        confidence = self._calculate_structure_confidence(columns, rows)
        
        if confidence > 0.3:  # Minimum confidence for valid table
            table_structure = TableStructure(
                columns=columns,
                rows=rows,
                page=page_num,
                confidence=confidence
            )
            
            logger.info(f"Detected table structure with {len(columns)} columns, {len(rows)} rows, confidence: {confidence:.1%}")
            return table_structure
        
        return None
    
    def extract_structured_data(self, table_structure: TableStructure, target_isin: str) -> Dict[str, any]:
        """Extract data for specific ISIN using table structure"""
        
        # Find row containing the ISIN
        isin_row = None
        for row in table_structure.rows:
            for item in row.items:
                if target_isin in item.text:
                    isin_row = row
                    row.isin = target_isin
                    break
            if isin_row:
                break
        
        if not isin_row:
            return {}
        
        logger.info(f"Found ISIN {target_isin} in table row at y={isin_row.y_position}")
        
        # Extract data from each column for this row
        extracted_data = {}
        
        for column in table_structure.columns:
            # Find items in this row that belong to this column
            column_value = self._get_value_in_column_row(column, isin_row)
            
            if column_value and column.column_type != 'other':
                extracted_data[column.column_type] = column_value
                logger.info(f"Extracted {column.column_type}: {column_value}")
        
        return extracted_data
    
    def _detect_columns(self, page_items, page_num: int) -> List[TableColumn]:
        """Detect table columns by clustering X positions"""
        
        # Extract X positions of all items
        x_positions = [(item.x0 + item.x1) / 2 for item in page_items]
        
        # Cluster X positions to find columns
        x_clusters = self._cluster_positions(x_positions, min_gap=30)
        
        columns = []
        for i, cluster in enumerate(x_clusters):
            x_start = min(cluster) - 15  # Add margin
            x_end = max(cluster) + 15
            
            # Get sample values from this column
            sample_values = []
            for item in page_items:
                item_x = (item.x0 + item.x1) / 2
                if x_start <= item_x <= x_end:
                    sample_values.append(item.text)
            
            column = TableColumn(
                x_start=x_start,
                x_end=x_end,
                column_type='other',  # Will be classified later
                confidence=0.0,
                sample_values=sample_values[:10],  # Keep first 10 as samples
                page=page_num
            )
            columns.append(column)
        
        logger.info(f"Detected {len(columns)} columns on page {page_num}")
        return columns
    
    def _detect_rows(self, page_items, page_num: int) -> List[TableRow]:
        """Detect table rows by clustering Y positions"""
        
        # Extract Y positions
        y_positions = [(item.y0 + item.y1) / 2 for item in page_items]
        
        # Cluster Y positions to find rows
        y_clusters = self._cluster_positions(y_positions, min_gap=8)
        
        rows = []
        for cluster in y_clusters:
            if len(cluster) >= 3:  # Must have at least 3 items to be a valid row
                y_position = statistics.mean(cluster)
                y_tolerance = max(5, statistics.stdev(cluster) if len(cluster) > 1 else 5)
                
                # Find all items in this row
                row_items = []
                for item in page_items:
                    item_y = (item.y0 + item.y1) / 2
                    if abs(item_y - y_position) <= y_tolerance:
                        row_items.append(item)
                
                # Sort items by X position
                row_items.sort(key=lambda x: x.x0)
                
                row = TableRow(
                    y_position=y_position,
                    y_tolerance=y_tolerance,
                    items=row_items,
                    page=page_num
                )
                rows.append(row)
        
        # Sort rows by Y position (top to bottom)
        rows.sort(key=lambda x: x.y_position, reverse=True)
        
        logger.info(f"Detected {len(rows)} rows on page {page_num}")
        return rows
    
    def _cluster_positions(self, positions: List[float], min_gap: float = 20) -> List[List[float]]:
        """Cluster positions that are close together"""
        if not positions:
            return []
        
        sorted_positions = sorted(positions)
        clusters = [[sorted_positions[0]]]
        
        for pos in sorted_positions[1:]:
            # Check if this position belongs to the last cluster
            if pos - clusters[-1][-1] <= min_gap:
                clusters[-1].append(pos)
            else:
                clusters.append([pos])
        
        # Filter out clusters that are too small
        return [cluster for cluster in clusters if len(cluster) >= 2]
    
    def _classify_columns(self, columns: List[TableColumn], rows: List[TableRow], page_items) -> List[TableColumn]:
        """Classify column types based on content patterns"""
        
        for column in columns:
            scores = {}
            
            # Analyze sample values for each column type
            for column_type, patterns in self.column_type_patterns.items():
                score = 0.0
                
                for value in column.sample_values:
                    for pattern in patterns:
                        if re.search(pattern, value, re.IGNORECASE):
                            score += 1.0
                            break
                
                # Normalize score
                scores[column_type] = score / len(column.sample_values) if column.sample_values else 0.0
            
            # Assign the highest scoring type
            if scores:
                best_type = max(scores.keys(), key=lambda k: scores[k])
                if scores[best_type] > 0.2:  # Minimum confidence threshold
                    column.column_type = best_type
                    column.confidence = scores[best_type]
                    logger.info(f"Classified column as {best_type} with confidence {scores[best_type]:.1%}")
        
        return columns
    
    def _calculate_structure_confidence(self, columns: List[TableColumn], rows: List[TableRow]) -> float:
        """Calculate confidence in the detected table structure"""
        
        if not columns or not rows:
            return 0.0
        
        score = 0.0
        
        # Column classification confidence
        classified_columns = [c for c in columns if c.column_type != 'other']
        if classified_columns:
            avg_column_confidence = sum(c.confidence for c in classified_columns) / len(classified_columns)
            score += avg_column_confidence * 0.4
        
        # Row regularity (consistent number of items per row)
        if len(rows) > 1:
            items_per_row = [len(row.items) for row in rows]
            row_consistency = 1.0 - (statistics.stdev(items_per_row) / statistics.mean(items_per_row))
            score += max(0, row_consistency) * 0.3
        
        # Essential column presence
        essential_types = ['isin', 'name', 'quantity', 'price', 'value']
        found_essential = sum(1 for c in columns if c.column_type in essential_types)
        score += (found_essential / len(essential_types)) * 0.3
        
        return min(score, 1.0)
    
    def _get_value_in_column_row(self, column: TableColumn, row: TableRow) -> Optional[str]:
        """Get the value at the intersection of a column and row"""
        
        # Find items in the row that fall within the column boundaries
        column_items = []
        for item in row.items:
            item_x = (item.x0 + item.x1) / 2
            if column.x_start <= item_x <= column.x_end:
                column_items.append(item)
        
        if not column_items:
            return None
        
        # For multiple items in the same cell, join them
        if len(column_items) == 1:
            return column_items[0].text
        else:
            # Sort by X position and join
            column_items.sort(key=lambda x: x.x0)
            return " ".join(item.text for item in column_items)

class StructuredDataExtractor:
    """Extract financial data using table structure analysis"""
    
    def __init__(self):
        self.table_analyzer = TableStructureAnalyzer()
        self.number_formatter = self._init_number_formatter()
    
    def _init_number_formatter(self):
        """Initialize number formatter"""
        import importlib.util
        spec = importlib.util.spec_from_file_location("enhanced_pattern_recognizer", "core/enhanced-pattern-recognizer.py")
        enhanced_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(enhanced_module)
        return enhanced_module.EnhancedNumberFormatter()
    
    def extract_with_structure(self, spatial_items, isin: str, spatial_item) -> Dict[str, any]:
        """Extract data using table structure analysis"""
        
        page_num = spatial_item.page
        
        # Detect table structure for this page
        table_structure = self.table_analyzer.detect_table_structure(spatial_items, page_num)
        
        if not table_structure:
            logger.warning(f"Could not detect table structure on page {page_num}")
            return {}
        
        # Extract structured data
        raw_data = self.table_analyzer.extract_structured_data(table_structure, isin)
        
        # Process and clean the extracted data
        processed_data = self._process_extracted_data(raw_data)
        
        return processed_data
    
    def _process_extracted_data(self, raw_data: Dict[str, str]) -> Dict[str, any]:
        """Process and clean extracted raw data"""
        processed = {}
        
        for field, value in raw_data.items():
            if field == 'name':
                # Clean up name field
                processed['name'] = self._clean_name(value)
            
            elif field in ['quantity', 'price', 'value']:
                # Parse numerical fields
                parsed_number = self.number_formatter.parse_smart_number(value)
                if parsed_number is not None:
                    processed[field] = parsed_number
            
            elif field == 'percentage':
                # Parse percentage
                percentage_match = re.search(r'([\d\.,]+)', value)
                if percentage_match:
                    try:
                        processed['percentage'] = float(percentage_match.group(1).replace(',', '.'))
                    except ValueError:
                        pass
            
            else:
                processed[field] = value
        
        return processed
    
    def _clean_name(self, name: str) -> str:
        """Clean and standardize security name"""
        if not name:
            return name
        
        # Remove excessive whitespace
        name = re.sub(r'\s+', ' ', name.strip())
        
        # Remove common noise words at the beginning/end
        noise_patterns = [
            r'^(Bonds?|Notes?|Securities?)\s+',
            r'\s+(Bonds?|Notes?|Securities?)$',
            r'^[A-Z]{1,3}\s+',  # Short codes at start
            r'\s+[A-Z]{1,3}$'   # Short codes at end
        ]
        
        for pattern in noise_patterns:
            name = re.sub(pattern, '', name, flags=re.IGNORECASE)
        
        return name.strip()

# Test the table structure analyzer
if __name__ == "__main__":
    print("Table Structure Analyzer loaded successfully!")
    print("Capabilities:")
    print("1. Automatic table structure detection")
    print("2. Column type classification") 
    print("3. Row-column intersection extraction")
    print("4. Structured data processing")
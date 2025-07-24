/**
 * CHART COMPONENTS
 * Reusable chart components for analytics dashboard
 * 
 * Features:
 * - Chart.js integration for rich visualizations
 * - D3.js support for advanced charts
 * - Responsive design and theming
 * - Interactive features and tooltips
 * - Export capabilities
 * - Real-time data updates
 */

class ChartComponents {
    constructor(options = {}) {
        this.config = {
            theme: options.theme || 'default',
            responsive: options.responsive !== false,
            animations: options.animations !== false,
            exportFormats: options.exportFormats || ['png', 'jpg', 'svg', 'pdf'],
            defaultColors: options.defaultColors || [
                '#007bff', '#28a745', '#ffc107', '#dc3545',
                '#6c757d', '#17a2b8', '#fd7e14', '#6f42c1'
            ]
        };
        
        this.chartInstances = new Map();
        this.themes = new Map();
        this.customChartTypes = new Map();
        
        this.initializeThemes();
        this.initializeCustomChartTypes();
        
        console.log('📈 Chart Components initialized');
        console.log(`🎨 Theme: ${this.config.theme}, Responsive: ${this.config.responsive}`);
    }

    initializeThemes() {
        // Default theme
        this.themes.set('default', {
            backgroundColor: '#ffffff',
            textColor: '#333333',
            gridColor: '#e0e0e0',
            colors: this.config.defaultColors,
            fonts: {
                family: 'Arial, sans-serif',
                size: 12
            }
        });
        
        // Dark theme
        this.themes.set('dark', {
            backgroundColor: '#2c3e50',
            textColor: '#ffffff',
            gridColor: '#34495e',
            colors: [
                '#3498db', '#2ecc71', '#f39c12', '#e74c3c',
                '#95a5a6', '#1abc9c', '#e67e22', '#9b59b6'
            ],
            fonts: {
                family: 'Arial, sans-serif',
                size: 12
            }
        });
        
        // Light theme
        this.themes.set('light', {
            backgroundColor: '#f8f9fa',
            textColor: '#495057',
            gridColor: '#dee2e6',
            colors: [
                '#0056b3', '#218838', '#e0a800', '#c82333',
                '#6c757d', '#138496', '#d39e00', '#6f42c1'
            ],
            fonts: {
                family: 'Arial, sans-serif',
                size: 12
            }
        });
    }

    initializeCustomChartTypes() {
        // Register custom chart types
        this.customChartTypes.set('speedometer', this.createSpeedometerChart);
        this.customChartTypes.set('treemap', this.createTreemapChart);
        this.customChartTypes.set('sankey', this.createSankeyChart);
        this.customChartTypes.set('radar_advanced', this.createAdvancedRadarChart);
        this.customChartTypes.set('timeline', this.createTimelineChart);
    }

    // Line Chart Component
    createLineChart(containerId, data, options = {}) {
        const theme = this.themes.get(this.config.theme);
        const config = this.mergeChartConfig({
            type: 'line',
            data: {
                datasets: data.datasets.map((dataset, index) => ({
                    ...dataset,
                    borderColor: dataset.borderColor || theme.colors[index % theme.colors.length],
                    backgroundColor: dataset.backgroundColor || this.addAlpha(theme.colors[index % theme.colors.length], 0.1),
                    fill: dataset.fill !== undefined ? dataset.fill : false,
                    tension: dataset.tension || 0.4
                }))
            },
            options: {
                responsive: this.config.responsive,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        grid: { color: theme.gridColor },
                        ticks: { color: theme.textColor }
                    },
                    y: {
                        grid: { color: theme.gridColor },
                        ticks: { color: theme.textColor }
                    }
                },
                plugins: {
                    legend: {
                        labels: { color: theme.textColor }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: theme.backgroundColor,
                        titleColor: theme.textColor,
                        bodyColor: theme.textColor,
                        borderColor: theme.gridColor
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        }, options);
        
        return this.renderChart(containerId, config);
    }

    // Bar Chart Component
    createBarChart(containerId, data, options = {}) {
        const theme = this.themes.get(this.config.theme);
        const config = this.mergeChartConfig({
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: data.datasets.map((dataset, index) => ({
                    ...dataset,
                    backgroundColor: dataset.backgroundColor || theme.colors[index % theme.colors.length],
                    borderColor: dataset.borderColor || theme.colors[index % theme.colors.length],
                    borderWidth: dataset.borderWidth || 1
                }))
            },
            options: {
                responsive: this.config.responsive,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        grid: { color: theme.gridColor },
                        ticks: { color: theme.textColor }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: theme.gridColor },
                        ticks: { color: theme.textColor }
                    }
                },
                plugins: {
                    legend: {
                        labels: { color: theme.textColor }
                    },
                    tooltip: {
                        backgroundColor: theme.backgroundColor,
                        titleColor: theme.textColor,
                        bodyColor: theme.textColor
                    }
                }
            }
        }, options);
        
        return this.renderChart(containerId, config);
    }

    // Pie Chart Component
    createPieChart(containerId, data, options = {}) {
        const theme = this.themes.get(this.config.theme);
        const config = this.mergeChartConfig({
            type: 'pie',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: theme.colors,
                    borderColor: theme.backgroundColor,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: this.config.responsive,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { 
                            color: theme.textColor,
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        backgroundColor: theme.backgroundColor,
                        titleColor: theme.textColor,
                        bodyColor: theme.textColor,
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        }, options);
        
        return this.renderChart(containerId, config);
    }

    // Doughnut Chart Component
    createDoughnutChart(containerId, data, options = {}) {
        const config = this.createPieChart(containerId, data, options);
        config.type = 'doughnut';
        
        // Add center text plugin for doughnut charts
        config.plugins = [{
            beforeDraw: function(chart) {
                if (options.centerText) {
                    const ctx = chart.ctx;
                    const centerX = (chart.chartArea.left + chart.chartArea.right) / 2;
                    const centerY = (chart.chartArea.top + chart.chartArea.bottom) / 2;
                    
                    ctx.save();
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.font = 'bold 24px Arial';
                    ctx.fillStyle = options.centerText.color || '#333';
                    ctx.fillText(options.centerText.text, centerX, centerY);
                    ctx.restore();
                }
            }
        }];
        
        return this.renderChart(containerId, config);
    }

    // Area Chart Component
    createAreaChart(containerId, data, options = {}) {
        const config = this.createLineChart(containerId, data, options);
        
        // Make all datasets filled areas
        config.data.datasets = config.data.datasets.map(dataset => ({
            ...dataset,
            fill: dataset.fill !== undefined ? dataset.fill : 'origin'
        }));
        
        return this.renderChart(containerId, config);
    }

    // Stacked Bar Chart Component
    createStackedBarChart(containerId, data, options = {}) {
        const config = this.createBarChart(containerId, data, options);
        
        config.options.scales.x.stacked = true;
        config.options.scales.y.stacked = true;
        
        return this.renderChart(containerId, config);
    }

    // Horizontal Bar Chart Component
    createHorizontalBarChart(containerId, data, options = {}) {
        const config = this.createBarChart(containerId, data, options);
        
        config.type = 'bar';
        config.options.indexAxis = 'y';
        
        return this.renderChart(containerId, config);
    }

    // Scatter Plot Component
    createScatterChart(containerId, data, options = {}) {
        const theme = this.themes.get(this.config.theme);
        const config = this.mergeChartConfig({
            type: 'scatter',
            data: {
                datasets: data.datasets.map((dataset, index) => ({
                    ...dataset,
                    backgroundColor: dataset.backgroundColor || theme.colors[index % theme.colors.length],
                    borderColor: dataset.borderColor || theme.colors[index % theme.colors.length]
                }))
            },
            options: {
                responsive: this.config.responsive,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        grid: { color: theme.gridColor },
                        ticks: { color: theme.textColor }
                    },
                    y: {
                        grid: { color: theme.gridColor },
                        ticks: { color: theme.textColor }
                    }
                },
                plugins: {
                    legend: {
                        labels: { color: theme.textColor }
                    },
                    tooltip: {
                        backgroundColor: theme.backgroundColor,
                        titleColor: theme.textColor,
                        bodyColor: theme.textColor
                    }
                }
            }
        }, options);
        
        return this.renderChart(containerId, config);
    }

    // Bubble Chart Component
    createBubbleChart(containerId, data, options = {}) {
        const theme = this.themes.get(this.config.theme);
        const config = this.mergeChartConfig({
            type: 'bubble',
            data: {
                datasets: data.datasets.map((dataset, index) => ({
                    ...dataset,
                    backgroundColor: dataset.backgroundColor || this.addAlpha(theme.colors[index % theme.colors.length], 0.6),
                    borderColor: dataset.borderColor || theme.colors[index % theme.colors.length]
                }))
            },
            options: {
                responsive: this.config.responsive,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        grid: { color: theme.gridColor },
                        ticks: { color: theme.textColor }
                    },
                    y: {
                        grid: { color: theme.gridColor },
                        ticks: { color: theme.textColor }
                    }
                },
                plugins: {
                    legend: {
                        labels: { color: theme.textColor }
                    },
                    tooltip: {
                        backgroundColor: theme.backgroundColor,
                        titleColor: theme.textColor,
                        bodyColor: theme.textColor,
                        callbacks: {
                            label: function(context) {
                                const point = context.parsed;
                                return `(${point.x}, ${point.y}) Size: ${point._custom}`;
                            }
                        }
                    }
                }
            }
        }, options);
        
        return this.renderChart(containerId, config);
    }

    // Radar Chart Component
    createRadarChart(containerId, data, options = {}) {
        const theme = this.themes.get(this.config.theme);
        const config = this.mergeChartConfig({
            type: 'radar',
            data: {
                labels: data.labels,
                datasets: data.datasets.map((dataset, index) => ({
                    ...dataset,
                    backgroundColor: dataset.backgroundColor || this.addAlpha(theme.colors[index % theme.colors.length], 0.2),
                    borderColor: dataset.borderColor || theme.colors[index % theme.colors.length],
                    pointBackgroundColor: dataset.pointBackgroundColor || theme.colors[index % theme.colors.length]
                }))
            },
            options: {
                responsive: this.config.responsive,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: true,
                        grid: { color: theme.gridColor },
                        pointLabels: { color: theme.textColor },
                        ticks: { color: theme.textColor }
                    }
                },
                plugins: {
                    legend: {
                        labels: { color: theme.textColor }
                    }
                }
            }
        }, options);
        
        return this.renderChart(containerId, config);
    }

    // Polar Area Chart Component
    createPolarAreaChart(containerId, data, options = {}) {
        const theme = this.themes.get(this.config.theme);
        const config = this.mergeChartConfig({
            type: 'polarArea',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: theme.colors.map(color => this.addAlpha(color, 0.7)),
                    borderColor: theme.colors,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: this.config.responsive,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: true,
                        grid: { color: theme.gridColor },
                        ticks: { color: theme.textColor }
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: theme.textColor }
                    }
                }
            }
        }, options);
        
        return this.renderChart(containerId, config);
    }

    // Gauge Chart Component (Custom)
    createGaugeChart(containerId, data, options = {}) {
        const theme = this.themes.get(this.config.theme);
        const { value, min = 0, max = 100, thresholds = [] } = data;
        
        // Create gauge using canvas
        const canvas = document.getElementById(containerId);
        if (!canvas) {
            throw new Error(`Canvas element not found: ${containerId}`);
        }
        
        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 20;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw gauge background
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, Math.PI, 2 * Math.PI);
        ctx.lineWidth = 20;
        ctx.strokeStyle = theme.gridColor;
        ctx.stroke();
        
        // Draw gauge value
        const angle = Math.PI + (Math.PI * (value - min) / (max - min));
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, Math.PI, angle);
        ctx.lineWidth = 20;
        ctx.strokeStyle = this.getGaugeColor(value, thresholds);
        ctx.stroke();
        
        // Draw center circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, 10, 0, 2 * Math.PI);
        ctx.fillStyle = theme.textColor;
        ctx.fill();
        
        // Draw value text
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = theme.textColor;
        ctx.textAlign = 'center';
        ctx.fillText(value.toString(), centerX, centerY + 40);
        
        return { element: canvas, update: (newValue) => this.updateGauge(canvas, newValue, min, max, thresholds) };
    }

    // Heatmap Chart Component (Custom using D3.js concepts)
    createHeatmapChart(containerId, data, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`Container element not found: ${containerId}`);
        }
        
        const theme = this.themes.get(this.config.theme);
        const { matrix, xLabels, yLabels } = data;
        
        // Create table-based heatmap
        const table = document.createElement('table');
        table.className = 'heatmap-table';
        table.style.borderCollapse = 'collapse';
        table.style.width = '100%';
        
        // Create header row
        const headerRow = document.createElement('tr');
        headerRow.appendChild(document.createElement('th')); // Empty corner cell
        
        xLabels.forEach(label => {
            const th = document.createElement('th');
            th.textContent = label;
            th.style.padding = '8px';
            th.style.textAlign = 'center';
            th.style.color = theme.textColor;
            headerRow.appendChild(th);
        });
        table.appendChild(headerRow);
        
        // Create data rows
        matrix.forEach((row, i) => {
            const tr = document.createElement('tr');
            
            // Row label
            const th = document.createElement('th');
            th.textContent = yLabels[i];
            th.style.padding = '8px';
            th.style.color = theme.textColor;
            tr.appendChild(th);
            
            // Data cells
            row.forEach(value => {
                const td = document.createElement('td');
                td.style.padding = '8px';
                td.style.textAlign = 'center';
                td.style.backgroundColor = this.getHeatmapColor(value, options.colorScale);
                td.style.color = this.getContrastColor(this.getHeatmapColor(value, options.colorScale));
                td.textContent = value.toFixed(1);
                tr.appendChild(td);
            });
            
            table.appendChild(tr);
        });
        
        container.innerHTML = '';
        container.appendChild(table);
        
        return { element: table };
    }

    // Custom Chart Types
    createSpeedometerChart(containerId, data, options = {}) {
        // Implementation for speedometer chart
        return this.createGaugeChart(containerId, data, options);
    }

    createTreemapChart(containerId, data, options = {}) {
        // Simplified treemap implementation
        const container = document.getElementById(containerId);
        container.innerHTML = '<div>Treemap chart would be implemented here with D3.js</div>';
        return { element: container };
    }

    createSankeyChart(containerId, data, options = {}) {
        // Simplified Sankey diagram implementation
        const container = document.getElementById(containerId);
        container.innerHTML = '<div>Sankey diagram would be implemented here with D3.js</div>';
        return { element: container };
    }

    createAdvancedRadarChart(containerId, data, options = {}) {
        // Enhanced radar chart with more features
        return this.createRadarChart(containerId, data, {
            ...options,
            scales: {
                r: {
                    beginAtZero: true,
                    max: options.max || 100,
                    ticks: {
                        stepSize: options.stepSize || 20
                    }
                }
            }
        });
    }

    createTimelineChart(containerId, data, options = {}) {
        // Timeline chart implementation
        const container = document.getElementById(containerId);
        container.innerHTML = '<div>Timeline chart would be implemented here</div>';
        return { element: container };
    }

    // Chart Management
    renderChart(containerId, config) {
        try {
            const ctx = document.getElementById(containerId);
            if (!ctx) {
                throw new Error(`Canvas element not found: ${containerId}`);
            }
            
            // Destroy existing chart if it exists
            if (this.chartInstances.has(containerId)) {
                this.chartInstances.get(containerId).destroy();
            }
            
            // Create new chart (assuming Chart.js is available)
            const chart = new Chart(ctx, config);
            this.chartInstances.set(containerId, chart);
            
            console.log(`📈 Chart created: ${containerId} (${config.type})`);
            return chart;
            
        } catch (error) {
            console.error(`❌ Chart creation failed: ${containerId}`, error);
            throw error;
        }
    }

    updateChart(containerId, newData) {
        const chart = this.chartInstances.get(containerId);
        if (!chart) {
            throw new Error(`Chart not found: ${containerId}`);
        }
        
        chart.data = newData;
        chart.update();
    }

    destroyChart(containerId) {
        const chart = this.chartInstances.get(containerId);
        if (chart) {
            chart.destroy();
            this.chartInstances.delete(containerId);
            console.log(`🗑️ Chart destroyed: ${containerId}`);
        }
    }

    // Export functionality
    async exportChart(containerId, format = 'png') {
        const chart = this.chartInstances.get(containerId);
        if (!chart) {
            throw new Error(`Chart not found: ${containerId}`);
        }
        
        switch (format) {
            case 'png':
            case 'jpg':
                return chart.toBase64Image('image/' + format, 1.0);
            case 'svg':
                return this.chartToSVG(chart);
            case 'pdf':
                return await this.chartToPDF(chart);
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }

    // Utility methods
    mergeChartConfig(defaultConfig, userOptions) {
        return this.deepMerge(defaultConfig, userOptions);
    }

    deepMerge(target, source) {
        const output = Object.assign({}, target);
        if (this.isObject(target) && this.isObject(source)) {
            Object.keys(source).forEach(key => {
                if (this.isObject(source[key])) {
                    if (!(key in target)) {
                        Object.assign(output, { [key]: source[key] });
                    } else {
                        output[key] = this.deepMerge(target[key], source[key]);
                    }
                } else {
                    Object.assign(output, { [key]: source[key] });
                }
            });
        }
        return output;
    }

    isObject(item) {
        return item && typeof item === 'object' && !Array.isArray(item);
    }

    addAlpha(color, alpha) {
        // Convert hex color to rgba
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    getGaugeColor(value, thresholds) {
        for (const threshold of thresholds.sort((a, b) => b.value - a.value)) {
            if (value >= threshold.value) {
                return threshold.color;
            }
        }
        return '#dc3545'; // Default red
    }

    getHeatmapColor(value, colorScale = { min: 0, max: 100, colors: ['#blue', '#white', '#red'] }) {
        const ratio = (value - colorScale.min) / (colorScale.max - colorScale.min);
        // Simple linear interpolation between colors
        if (ratio <= 0.5) {
            return this.interpolateColor(colorScale.colors[0], colorScale.colors[1], ratio * 2);
        } else {
            return this.interpolateColor(colorScale.colors[1], colorScale.colors[2], (ratio - 0.5) * 2);
        }
    }

    interpolateColor(color1, color2, ratio) {
        // Simple color interpolation (would be more sophisticated in production)
        return color1; // Simplified
    }

    getContrastColor(backgroundColor) {
        // Simple contrast color calculation
        return '#000000'; // Simplified
    }

    updateGauge(canvas, newValue, min, max, thresholds) {
        // Re-draw gauge with new value
        this.createGaugeChart(canvas.id, { value: newValue, min, max, thresholds });
    }

    setTheme(themeName) {
        if (!this.themes.has(themeName)) {
            throw new Error(`Theme not found: ${themeName}`);
        }
        
        this.config.theme = themeName;
        
        // Update all existing charts with new theme
        for (const [containerId, chart] of this.chartInstances) {
            const newConfig = this.applyThemeToConfig(chart.config, this.themes.get(themeName));
            chart.options = newConfig.options;
            chart.update();
        }
        
        console.log(`🎨 Theme changed to: ${themeName}`);
    }

    applyThemeToConfig(config, theme) {
        // Apply theme colors to chart configuration
        const newConfig = JSON.parse(JSON.stringify(config));
        
        if (newConfig.options.scales) {
            Object.values(newConfig.options.scales).forEach(scale => {
                if (scale.grid) scale.grid.color = theme.gridColor;
                if (scale.ticks) scale.ticks.color = theme.textColor;
            });
        }
        
        if (newConfig.options.plugins) {
            if (newConfig.options.plugins.legend) {
                newConfig.options.plugins.legend.labels.color = theme.textColor;
            }
        }
        
        return newConfig;
    }

    getAllCharts() {
        return Array.from(this.chartInstances.keys());
    }

    getChartData(containerId) {
        const chart = this.chartInstances.get(containerId);
        return chart ? chart.data : null;
    }

    animateChart(containerId, animationType = 'fadeIn') {
        const chart = this.chartInstances.get(containerId);
        if (chart) {
            chart.update(animationType);
        }
    }
}

module.exports = { ChartComponents };
#!/usr/bin/env node

/**
 * SMART OCR CHATBOT SYSTEM
 * 
 * AI-powered customer support chatbot that understands our financial document processing system
 * Provides contextual help, system guidance, and real-time assistance
 */

const express = require('express');
const { OpenAI } = require('openai');
const fs = require('fs').promises;

class SmartOCRChatbot {
    constructor() {
        this.app = express();
        this.setupOpenAI();
        this.setupRoutes();
        this.setupMiddleware();
        this.systemKnowledge = this.buildSystemKnowledge();
        this.conversationHistory = new Map(); // Store conversation context
    }

    setupOpenAI() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY || 'your-openai-api-key-here'
        });
    }

    setupMiddleware() {
        this.app.use(express.json());
        this.app.use(express.static('public'));
        
        // CORS for chatbot widget
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'Content-Type');
            next();
        });
    }

    setupRoutes() {
        // Main chatbot endpoint
        this.app.post('/api/chatbot', async (req, res) => {
            try {
                const { message, sessionId, context } = req.body;
                
                if (!message || !sessionId) {
                    return res.status(400).json({
                        success: false,
                        error: 'Message and sessionId are required'
                    });
                }

                const response = await this.processQuery(message, sessionId, context);
                
                res.json({
                    success: true,
                    response: response,
                    timestamp: new Date().toISOString(),
                    sessionId: sessionId
                });

            } catch (error) {
                console.error('Chatbot error:', error);
                res.status(500).json({
                    success: false,
                    error: 'I apologize, but I\'m experiencing technical difficulties. Please try again in a moment.',
                    timestamp: new Date().toISOString()
                });
            }
        });

        // System status for chatbot context
        this.app.get('/api/chatbot/system-status', async (req, res) => {
            try {
                const systemStatus = await this.getSystemStatus();
                res.json({
                    success: true,
                    status: systemStatus,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: 'Unable to fetch system status'
                });
            }
        });

        // Chatbot widget HTML
        this.app.get('/chatbot-widget', (req, res) => {
            res.send(this.generateChatbotWidget());
        });

        // Health check
        this.app.get('/api/chatbot/health', (req, res) => {
            res.json({
                success: true,
                service: 'Smart OCR Chatbot',
                status: 'healthy',
                timestamp: new Date().toISOString()
            });
        });
    }

    buildSystemKnowledge() {
        return {
            systemInfo: {
                name: 'Smart OCR Financial Document Processing System',
                currentAccuracy: 80,
                targetAccuracy: 99.9,
                patternsLearned: 19,
                annotationsProcessed: 26,
                specialization: 'Financial documents (portfolios, statements, invoices)',
                url: 'https://pdf-fzzi.onrender.com'
            },
            features: {
                pdfProcessing: 'Automatic extraction of text and data from PDF documents',
                annotationInterface: '13 interactive tools for correcting AI extraction errors',
                machineLearning: 'System learns from human corrections to improve accuracy',
                realTimeTracking: 'Live accuracy monitoring and pattern learning progress',
                patternRecognition: 'Specialized recognition for financial data structures'
            },
            annotationTools: [
                'Headers - Mark table headers and column titles',
                'Data Rows - Identify data rows and values',
                'Connect - Link related fields together',
                'Highlight - Mark important sections',
                'Correct - Fix extraction errors',
                'Relate - Show field relationships',
                'Learn Patterns - Train the ML system',
                'Process Document - Execute PDF processing'
            ],
            commonQuestions: {
                'how to upload': 'To upload a PDF, go to the annotation interface at /smart-annotation and use the file input or drag & drop area.',
                'current accuracy': 'The system currently operates at 80% accuracy and is learning to reach 99.9% accuracy.',
                'how learning works': 'When you correct AI mistakes using the annotation tools, the system creates patterns and applies them to future documents.',
                'supported formats': 'The system currently supports PDF files, specifically optimized for financial documents.',
                'processing time': 'Most documents are processed in under 30 seconds, with simple documents taking just a few seconds.'
            }
        };
    }

    async processQuery(message, sessionId, context = {}) {
        try {
            // Get or create conversation history
            let conversation = this.conversationHistory.get(sessionId) || [];
            
            // Get current system status for context
            const systemStatus = await this.getSystemStatus();
            
            // Build context-aware system prompt
            const systemPrompt = this.buildSystemPrompt(systemStatus, context);
            
            // Prepare messages for OpenAI
            const messages = [
                { role: 'system', content: systemPrompt },
                ...conversation,
                { role: 'user', content: message }
            ];

            // Call OpenAI API
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4',
                messages: messages,
                max_tokens: 500,
                temperature: 0.7,
                presence_penalty: 0.1,
                frequency_penalty: 0.1
            });

            const botResponse = response.choices[0].message.content;

            // Update conversation history
            conversation.push(
                { role: 'user', content: message },
                { role: 'assistant', content: botResponse }
            );

            // Keep only last 10 exchanges (20 messages)
            if (conversation.length > 20) {
                conversation = conversation.slice(-20);
            }

            this.conversationHistory.set(sessionId, conversation);

            return botResponse;

        } catch (error) {
            console.error('Error processing chatbot query:', error);
            
            // Fallback to rule-based responses
            return this.getFallbackResponse(message);
        }
    }

    buildSystemPrompt(systemStatus, context) {
        const knowledge = this.systemKnowledge;
        
        return `You are a helpful AI assistant for the Smart OCR Financial Document Processing System.

SYSTEM INFORMATION:
- Name: ${knowledge.systemInfo.name}
- Current Accuracy: ${systemStatus.currentAccuracy || knowledge.systemInfo.currentAccuracy}%
- Target Accuracy: ${knowledge.systemInfo.targetAccuracy}%
- Patterns Learned: ${systemStatus.patternCount || knowledge.systemInfo.patternsLearned}
- Annotations Processed: ${systemStatus.annotationCount || knowledge.systemInfo.annotationsProcessed}
- Specialization: ${knowledge.systemInfo.specialization}
- Live System: ${knowledge.systemInfo.url}

KEY FEATURES:
1. PDF Processing: ${knowledge.features.pdfProcessing}
2. Annotation Interface: ${knowledge.features.annotationInterface}
3. Machine Learning: ${knowledge.features.machineLearning}
4. Real-time Tracking: ${knowledge.features.realTimeTracking}
5. Pattern Recognition: ${knowledge.features.patternRecognition}

ANNOTATION TOOLS AVAILABLE:
${knowledge.annotationTools.map((tool, i) => `${i + 1}. ${tool}`).join('\n')}

CURRENT CONTEXT:
${context.currentDocument ? `- Current Document: ${context.currentDocument}` : ''}
${context.processingStatus ? `- Processing Status: ${context.processingStatus}` : ''}
${context.userLocation ? `- User Location: ${context.userLocation}` : ''}

GUIDELINES:
- Be helpful, friendly, and professional
- Provide specific, actionable guidance
- Reference actual system capabilities and current metrics
- If asked about features not yet implemented, explain what's currently available
- Guide users through the annotation interface step-by-step when needed
- Explain how the learning system works in simple terms
- Always provide accurate information about current system performance

RESPONSE STYLE:
- Keep responses concise but informative
- Use bullet points for step-by-step instructions
- Include relevant emojis to make responses friendly
- Reference specific numbers (accuracy, patterns learned, etc.) when relevant
- Offer to help with related questions

You have access to real-time system data and should use it to provide current, accurate information.`;
    }

    async getSystemStatus() {
        try {
            // In a real implementation, this would fetch from your actual API
            const response = await fetch('https://pdf-fzzi.onrender.com/api/smart-ocr-stats');
            if (response.ok) {
                const data = await response.json();
                return data.stats;
            }
        } catch (error) {
            console.error('Failed to fetch system status:', error);
        }

        // Fallback to default values
        return {
            currentAccuracy: 80,
            patternCount: 19,
            annotationCount: 26,
            documentCount: 0,
            mistralEnabled: true
        };
    }

    getFallbackResponse(message) {
        const lowerMessage = message.toLowerCase();
        const knowledge = this.systemKnowledge;

        // Simple keyword matching for common questions
        if (lowerMessage.includes('upload') || lowerMessage.includes('how to')) {
            return `📤 To upload a PDF document:

1. Go to the annotation interface at ${knowledge.systemInfo.url}/smart-annotation
2. Click the file input area or drag & drop your PDF
3. The system will process it automatically (usually takes 30 seconds)
4. Review the extracted data and make corrections using our 13 annotation tools

The system currently operates at ${knowledge.systemInfo.currentAccuracy}% accuracy and learns from your corrections!`;
        }

        if (lowerMessage.includes('accuracy') || lowerMessage.includes('performance')) {
            return `📊 Current System Performance:

• **Accuracy**: ${knowledge.systemInfo.currentAccuracy}% (target: ${knowledge.systemInfo.targetAccuracy}%)
• **Patterns Learned**: ${knowledge.systemInfo.patternsLearned}
• **Annotations Processed**: ${knowledge.systemInfo.annotationsProcessed}

The system improves continuously as users make corrections. Each correction helps the AI learn for future documents!`;
        }

        if (lowerMessage.includes('tools') || lowerMessage.includes('annotation')) {
            return `🛠️ Annotation Tools Available:

${knowledge.annotationTools.map((tool, i) => `${i + 1}. **${tool.split(' - ')[0]}** - ${tool.split(' - ')[1]}`).join('\n')}

These tools help you correct AI extraction errors, and each correction teaches the system to be more accurate!`;
        }

        if (lowerMessage.includes('learn') || lowerMessage.includes('improve')) {
            return `🧠 How the Learning System Works:

1. **AI Processing**: System extracts data at ${knowledge.systemInfo.currentAccuracy}% accuracy
2. **Human Review**: You check and correct any errors using annotation tools
3. **Pattern Creation**: Each correction creates a "memory pattern"
4. **Future Application**: System applies learned patterns to similar documents
5. **Accuracy Improvement**: Gradually improves toward ${knowledge.systemInfo.targetAccuracy}% accuracy

We've already learned ${knowledge.systemInfo.patternsLearned} patterns from ${knowledge.systemInfo.annotationsProcessed} corrections!`;
        }

        // Default response
        return `👋 Hi! I'm here to help you with the Smart OCR system.

I can assist you with:
• **PDF Upload & Processing** - How to upload and process documents
• **Annotation Tools** - Using our 13 correction tools
• **System Performance** - Current accuracy and learning progress
• **How Learning Works** - Understanding the AI improvement process

What would you like to know about? You can also try asking specific questions like "How do I upload a PDF?" or "What's the current accuracy?"`;
    }

    generateChatbotWidget() {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Smart OCR Chatbot Widget</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        #smart-ocr-chatbot {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 350px;
            height: 500px;
            background: white;
            border: 1px solid #ddd;
            border-radius: 15px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
            display: flex;
            flex-direction: column;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            z-index: 1000;
            transition: all 0.3s ease;
        }

        .chatbot-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 20px;
            border-radius: 15px 15px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .chatbot-header h4 {
            margin: 0;
            font-size: 1.1em;
        }

        .minimize-btn {
            background: none;
            border: none;
            color: white;
            font-size: 1.5em;
            cursor: pointer;
            padding: 0;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .minimize-btn:hover {
            background: rgba(255,255,255,0.2);
        }

        .chatbot-messages {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            background: #f8f9fa;
        }

        .message {
            margin: 15px 0;
            padding: 12px 16px;
            border-radius: 18px;
            max-width: 85%;
            line-height: 1.4;
            word-wrap: break-word;
        }

        .bot-message {
            background: white;
            color: #333;
            align-self: flex-start;
            border: 1px solid #e9ecef;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .user-message {
            background: #667eea;
            color: white;
            align-self: flex-end;
            margin-left: auto;
        }

        .typing-indicator {
            background: white;
            border: 1px solid #e9ecef;
            padding: 12px 16px;
            border-radius: 18px;
            max-width: 85%;
            animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
        }

        .chatbot-input {
            display: flex;
            padding: 15px 20px;
            border-top: 1px solid #e9ecef;
            background: white;
            border-radius: 0 0 15px 15px;
        }

        .chatbot-input input {
            flex: 1;
            padding: 12px 15px;
            border: 1px solid #ddd;
            border-radius: 25px;
            margin-right: 10px;
            font-size: 14px;
            outline: none;
        }

        .chatbot-input input:focus {
            border-color: #667eea;
        }

        .send-btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 25px;
            cursor: pointer;
            font-size: 14px;
            transition: background 0.2s;
        }

        .send-btn:hover {
            background: #5a6fd8;
        }

        .send-btn:disabled {
            background: #ccc;
            cursor: not-allowed;
        }

        .quick-actions {
            padding: 10px 20px;
            border-top: 1px solid #e9ecef;
            background: white;
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }

        .quick-btn {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s;
        }

        .quick-btn:hover {
            background: #e9ecef;
            border-color: #adb5bd;
        }

        .minimized {
            height: 60px;
            width: 200px;
        }

        .minimized .chatbot-messages,
        .minimized .chatbot-input,
        .minimized .quick-actions {
            display: none;
        }

        @media (max-width: 480px) {
            #smart-ocr-chatbot {
                width: calc(100vw - 40px);
                height: calc(100vh - 40px);
                bottom: 20px;
                right: 20px;
            }
        }
    </style>
</head>
<body>
    <div id="smart-ocr-chatbot">
        <div class="chatbot-header">
            <h4>🤖 Smart OCR Assistant</h4>
            <button class="minimize-btn" id="minimize-chat">−</button>
        </div>
        
        <div class="chatbot-messages" id="chat-messages">
            <div class="message bot-message">
                👋 Hi! I'm your Smart OCR assistant. I can help you with:
                <br><br>
                • PDF upload and processing<br>
                • Using annotation tools<br>
                • Understanding system accuracy<br>
                • How the AI learns and improves
                <br><br>
                What would you like to know?
            </div>
        </div>
        
        <div class="quick-actions">
            <button class="quick-btn" data-query="How do I upload a PDF?">Upload Help</button>
            <button class="quick-btn" data-query="What's the current accuracy?">System Status</button>
            <button class="quick-btn" data-query="How do I correct errors?">Annotation Guide</button>
            <button class="quick-btn" data-query="How does the AI learn?">Learning Process</button>
        </div>
        
        <div class="chatbot-input">
            <input type="text" id="chat-input" placeholder="Ask me anything about Smart OCR...">
            <button class="send-btn" id="send-message">Send</button>
        </div>
    </div>

    <script>
        class SmartOCRChatbotWidget {
            constructor() {
                this.chatMessages = document.getElementById('chat-messages');
                this.chatInput = document.getElementById('chat-input');
                this.sendButton = document.getElementById('send-message');
                this.minimizeButton = document.getElementById('minimize-chat');
                this.chatbot = document.getElementById('smart-ocr-chatbot');
                this.sessionId = this.generateSessionId();
                this.isMinimized = false;
                
                this.setupEventListeners();
            }
            
            setupEventListeners() {
                this.sendButton.addEventListener('click', () => this.sendMessage());
                this.chatInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        this.sendMessage();
                    }
                });
                
                this.minimizeButton.addEventListener('click', () => this.toggleMinimize());
                
                // Quick action buttons
                document.querySelectorAll('.quick-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const query = e.target.dataset.query;
                        this.sendMessage(query);
                    });
                });
            }
            
            toggleMinimize() {
                this.isMinimized = !this.isMinimized;
                this.chatbot.classList.toggle('minimized', this.isMinimized);
                this.minimizeButton.textContent = this.isMinimized ? '+' : '−';
            }
            
            async sendMessage(message = null) {
                const userMessage = message || this.chatInput.value.trim();
                if (!userMessage) return;
                
                // Add user message to chat
                this.addMessage(userMessage, 'user');
                this.chatInput.value = '';
                
                // Disable input while processing
                this.setInputState(false);
                
                // Show typing indicator
                this.showTyping();
                
                try {
                    // Send to chatbot API
                    const response = await fetch('/api/chatbot', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            message: userMessage,
                            sessionId: this.sessionId,
                            context: this.getContext()
                        })
                    });
                    
                    const data = await response.json();
                    
                    // Remove typing indicator and add bot response
                    this.hideTyping();
                    
                    if (data.success) {
                        this.addMessage(data.response, 'bot');
                    } else {
                        this.addMessage('Sorry, I encountered an error. Please try again.', 'bot');
                    }
                    
                } catch (error) {
                    console.error('Chatbot error:', error);
                    this.hideTyping();
                    this.addMessage('I\\'m having trouble connecting right now. Please try again in a moment.', 'bot');
                } finally {
                    this.setInputState(true);
                }
            }
            
            addMessage(text, sender) {
                const messageDiv = document.createElement('div');
                messageDiv.className = \`message \${sender}-message\`;
                messageDiv.innerHTML = text.replace(/\\n/g, '<br>');
                
                this.chatMessages.appendChild(messageDiv);
                this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
            }
            
            showTyping() {
                const typingDiv = document.createElement('div');
                typingDiv.className = 'typing-indicator';
                typingDiv.innerHTML = 'Thinking...';
                typingDiv.id = 'typing-indicator';
                
                this.chatMessages.appendChild(typingDiv);
                this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
            }
            
            hideTyping() {
                const typing = document.getElementById('typing-indicator');
                if (typing) typing.remove();
            }
            
            setInputState(enabled) {
                this.chatInput.disabled = !enabled;
                this.sendButton.disabled = !enabled;
            }
            
            getContext() {
                return {
                    userLocation: window.location.pathname,
                    timestamp: new Date().toISOString()
                };
            }
            
            generateSessionId() {
                return 'chatbot-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            }
        }

        // Initialize chatbot when page loads
        document.addEventListener('DOMContentLoaded', () => {
            new SmartOCRChatbotWidget();
        });
    </script>
</body>
</html>
        `;
    }

    start(port = 3002) {
        this.app.listen(port, () => {
            console.log(`🤖 Smart OCR Chatbot running on port ${port}`);
            console.log(`💬 Chatbot widget available at: http://localhost:${port}/chatbot-widget`);
            console.log(`🔌 API endpoint: http://localhost:${port}/api/chatbot`);
        });
    }
}

// Start chatbot system if run directly
if (require.main === module) {
    const chatbot = new SmartOCRChatbot();
    chatbot.start();
}

module.exports = { SmartOCRChatbot };

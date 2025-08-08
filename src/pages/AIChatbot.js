import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  PaperAirplaneIcon,
  SparklesIcon,
  LightBulbIcon,
  ChartBarIcon,
  CpuChipIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import { generateAIResponse } from '../utils/ai';

const AIChatbot = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: "Hello! I'm your Blue Data AI Assistant. I can help you analyze business insights, explain predictions, and provide strategic recommendations. What would you like to know?",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // AI Response Generator
  const generateLocalAIResponse = async (userMessage) => {
    setIsTyping(true);
    
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const responses = {
      'sales': {
        content: "Based on our analysis, your sales performance shows strong growth trends. Key insights:\n\n• Revenue increased by 15.3% this quarter\n• Top-performing products: Product C (30% growth)\n• Seasonal peak expected in Q4 (+18%)\n\nRecommendation: Focus on Product C expansion and prepare for Q4 demand surge.",
        insights: ['Revenue Growth', 'Product Performance', 'Seasonal Trends']
      },
      'customers': {
        content: "Customer analysis reveals valuable insights:\n\n• High-value customers: 35% of base, 60% of revenue\n• Customer retention rate: 87%\n• Cross-selling opportunities: 23% increase potential\n\nStrategy: Implement targeted retention programs for high-value segments.",
        insights: ['Customer Segments', 'Retention Rate', 'Cross-selling']
      },
      'logistics': {
        content: "Logistics optimization opportunities identified:\n\n• Delivery efficiency: 15% improvement potential\n• Cost reduction: 12% savings achievable\n• Route optimization: 18% enhancement possible\n\nAction: Implement predictive routing and real-time tracking.",
        insights: ['Delivery Efficiency', 'Cost Reduction', 'Route Optimization']
      },
      'predictions': {
        content: "Our predictive models show high accuracy:\n\n• Logistics Model: 95.2% accuracy\n• Customer Behavior: 92.8% accuracy\n• Sales Forecasting: 94.5% accuracy\n\nNext quarter forecast: 12.5% growth with 95% confidence.",
        insights: ['Model Accuracy', 'Growth Forecast', 'Confidence Levels']
      },
      'growth': {
        content: "Growth strategy recommendations:\n\n• Market expansion: 3 new regions identified\n• Product diversification: 2 new product lines\n• Customer acquisition: 25% increase target\n\nTimeline: 6-12 months for implementation.",
        insights: ['Market Expansion', 'Product Diversification', 'Customer Acquisition']
      },
      'default': {
        content: "I can help you with various aspects of your business data:\n\n• Sales performance and trends\n• Customer behavior analysis\n• Logistics optimization\n• Predictive analytics\n• Growth strategies\n\nWhat specific area would you like to explore?",
        insights: ['Sales Analysis', 'Customer Insights', 'Predictions']
      }
    };

    const userMessageLower = userMessage.toLowerCase();
    let responseKey = 'default';

    if (userMessageLower.includes('sales') || userMessageLower.includes('revenue')) {
      responseKey = 'sales';
    } else if (userMessageLower.includes('customer') || userMessageLower.includes('client')) {
      responseKey = 'customers';
    } else if (userMessageLower.includes('logistics') || userMessageLower.includes('delivery')) {
      responseKey = 'logistics';
    } else if (userMessageLower.includes('predict') || userMessageLower.includes('forecast')) {
      responseKey = 'predictions';
    } else if (userMessageLower.includes('growth') || userMessageLower.includes('strategy')) {
      responseKey = 'growth';
    }

    const response = responses[responseKey];
    
    setIsTyping(false);
    return response;
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // Try OpenAI first, fallback to local responses
    let aiResponse;
    try {
      const aiContent = await generateAIResponse(inputValue, 'Blue Data Analytics Dashboard');
      aiResponse = {
        content: aiContent,
        insights: ['AI Generated', 'Real-time Analysis', 'Strategic Insights']
      };
    } catch (error) {
      console.log('Using fallback response');
      aiResponse = await generateLocalAIResponse(inputValue);
    }
    
    const botMessage = {
      id: Date.now() + 1,
      type: 'bot',
      content: aiResponse.content,
      insights: aiResponse.insights,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, botMessage]);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickQuestions = [
    "How are our sales performing?",
    "What customer insights do you have?",
    "How can we optimize logistics?",
    "What are the growth predictions?",
    "Show me the latest trends",
  ];

  const insightsCards = [
    {
      title: "Sales Performance",
      description: "Revenue growth and product analysis",
      icon: ChartBarIcon,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Customer Insights",
      description: "Behavior patterns and segmentation",
      icon: CpuChipIcon,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Predictive Analytics",
      description: "Future trends and forecasts",
      icon: SparklesIcon,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">AI Business Assistant</h1>
        <p className="mt-2 text-gray-600">
          Intelligent insights and strategic recommendations powered by advanced analytics
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Interface */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-lg h-[600px] flex flex-col"
          >
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                  <ChatBubbleLeftRightIcon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">Blue Data AI Assistant</h3>
                  <p className="text-sm text-blue-100">Powered by Advanced Analytics</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="whitespace-pre-line">{message.content}</div>
                    {message.insights && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex flex-wrap gap-1">
                          {message.insights.map((insight, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              <LightBulbIcon className="h-3 w-3 mr-1" />
                              {insight}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="text-xs opacity-70 mt-2">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-sm">AI is thinking...</span>
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me about your business data..."
                  className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="2"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <PaperAirplaneIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Questions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white p-6 rounded-lg shadow"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Questions</h3>
            <div className="space-y-2">
              {quickQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => setInputValue(question)}
                  className="w-full text-left p-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          </motion.div>

          {/* AI Insights */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-lg shadow"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Insights</h3>
            <div className="space-y-3">
              {insightsCards.map((insight, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`p-2 rounded-lg ${insight.bgColor}`}>
                    <insight.icon className={`h-5 w-5 ${insight.color}`} />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{insight.title}</h4>
                    <p className="text-sm text-gray-600">{insight.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-lg shadow"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Sales Analysis Completed</p>
                  <p className="text-xs text-gray-500">2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Customer Insights Updated</p>
                  <p className="text-xs text-gray-500">5 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Predictions Generated</p>
                  <p className="text-xs text-gray-500">10 minutes ago</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AIChatbot;

"use client";

import { useState, useRef, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Bot, User, TrendingUp, BarChart3, MapPin, AlertTriangle } from "lucide-react";
import { ChatMessage, ChatTool } from "@/lib/types";

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm your Cleanon Analytics AI Assistant. I can help you with:\n\n• **KPI Overview** - Get current performance metrics\n• **Portfolio Analysis** - Analyze outlet portfolio\n• **Geographic Insights** - Geographic risk analysis\n• **Risk Assessment** - Assess outlet risks\n\nWhat would you like to know about?",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Simulate AI response - in production this would call the OpenAI API
      const response = await simulateAIResponse(inputValue);
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.content,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I apologize, but I encountered an error processing your request. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const simulateAIResponse = async (userInput: string): Promise<{ content: string; tools?: ChatTool[] }> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const lowerInput = userInput.toLowerCase();
    
    try {
      // Try to fetch real data to provide meaningful responses
      if (lowerInput.includes("kpi") || lowerInput.includes("overview") || lowerInput.includes("dashboard")) {
        const kpiResponse = await fetch('/api/kpi/overview');
        const kpiData = await kpiResponse.json();
        
        if (kpiData.success) {
          const data = kpiData.data;
          return {
            content: `Here's your current KPI overview for ${data.period}:
• **Grease Collected**: ${data.grease_collected_tons.toLocaleString()} tons (vs ${data.forecast_tons.toLocaleString()} forecast)
• **Inspection Compliance**: ${((data.total_outlets - data.missed_cleanings) / data.total_outlets * 100).toFixed(1)}% of outlets in compliance
• **Missed Cleanings**: ${(data.missed_cleanings || 0).toLocaleString()} outlets requiring attention
• **Total Outlets**: ${(data.total_outlets || 0).toLocaleString()} managed facilities`,

          };
        }
      }
      
      if (lowerInput.includes("risk") || lowerInput.includes("high risk") || lowerInput.includes("inspection")) {
        const portfolioResponse = await fetch('/api/predictions/portfolio');
        const portfolioData = await portfolioResponse.json();
        
        if (portfolioData.success) {
          const highRiskOutlets = portfolioData.data.items.filter((item: any) => item.p_miss_cleaning > 0.7);
          
          return {
            content: `I found **${highRiskOutlets.length}** high-risk outlets (>70% miss probability) requiring immediate inspection:

${highRiskOutlets.slice(0, 3).map((outlet: any, index: number) => 
  `${index + 1}. **${outlet.name}** (${outlet.area})
   • Grade: ${outlet.grade} | Risk: ${(outlet.p_miss_cleaning * 100).toFixed(0)}%
   • Next Due: ${outlet.next_due_date}`
).join('\n\n')}

${highRiskOutlets.length > 3 ? `\n...and ${highRiskOutlets.length - 3} more high-risk outlets.` : ''}`,

          };
        }
      }
      
      if (lowerInput.includes("area") || lowerInput.includes("location") || lowerInput.includes("map") || lowerInput.includes("geographic")) {
        const portfolioResponse = await fetch('/api/predictions/portfolio');
        const portfolioData = await portfolioResponse.json();
        
        if (portfolioData.success) {
          const areas = [...new Set(portfolioData.data.items.map((item: any) => item.area))];
          const areaStats = areas.slice(0, 5).map(area => {
            const areaOutlets = portfolioData.data.items.filter((item: any) => item.area === area);
            const avgRisk = areaOutlets.reduce((sum: number, item: any) => sum + item.p_miss_cleaning, 0) / areaOutlets.length;
            return { area, count: areaOutlets.length, avgRisk };
          });
          
          return {
            content: `Geographic analysis of your ${portfolioData.data.items.length} outlets across ${areas.length} areas:

${areaStats.map(stat => 
  `• **${stat.area}**: ${stat.count} outlets, avg risk ${(stat.avgRisk * 100).toFixed(1)}%`
).join('\n')}

**Coverage**: Spanning ${areas.length} areas across Dubai with coordinates from ${Math.min(...portfolioData.data.items.map((item: any) => item.lat)).toFixed(4)}° to ${Math.max(...portfolioData.data.items.map((item: any) => item.lat)).toFixed(4)}° latitude.`,

          };
        }
      }
      
      if (lowerInput.includes("performance") || lowerInput.includes("trend") || lowerInput.includes("forecast") || lowerInput.includes("volume")) {
        const portfolioResponse = await fetch('/api/predictions/portfolio');
        const portfolioData = await portfolioResponse.json();
        
        if (portfolioData.success) {
          const totalForecast = portfolioData.data.items.reduce((sum: number, item: any) => sum + item.forecast_volume_liters, 0);
          const avgRisk = portfolioData.data.items.reduce((sum: number, item: any) => sum + item.p_miss_cleaning, 0) / portfolioData.data.items.length;
          const gradeDistribution = ['A', 'B', 'C', 'D'].map(grade => ({
            grade,
            count: portfolioData.data.items.filter((item: any) => item.grade === grade).length
          }));
          
          return {
            content: `Portfolio performance analysis for **${portfolioData.data.period}**:

**Volume Forecast**: ${totalForecast.toLocaleString()} liters total predicted
**Average Risk**: ${(avgRisk * 100).toFixed(1)}% miss probability across portfolio
**Grade Distribution**: ${gradeDistribution.map(g => `${g.grade}: ${g.count}`).join(', ')}

**Key Insight**: ${avgRisk > 0.6 ? 'High risk levels detected - increase inspection frequency' : avgRisk > 0.4 ? 'Moderate risk levels - maintain current schedule' : 'Low risk levels - operations running smoothly'}`,

          };
        }
      }

      if (lowerInput.includes("restaurant") || lowerInput.includes("category")) {
        const portfolioResponse = await fetch('/api/predictions/portfolio');
        const portfolioData = await portfolioResponse.json();
        
        if (portfolioData.success) {
          const restaurants = portfolioData.data.items.filter((item: any) => item.category === 'Restaurant');
          const avgRestaurantRisk = restaurants.reduce((sum: number, item: any) => sum + item.p_miss_cleaning, 0) / restaurants.length;
          
          return {
            content: `Restaurant category analysis:

**${restaurants.length}** restaurants in portfolio with **${(avgRestaurantRisk * 100).toFixed(1)}%** average miss risk.

**Risk Breakdown**:
• High risk (>70%): ${restaurants.filter((r: any) => r.p_miss_cleaning > 0.7).length} restaurants
• Medium risk (40-70%): ${restaurants.filter((r: any) => r.p_miss_cleaning > 0.4 && r.p_miss_cleaning <= 0.7).length} restaurants  
• Low risk (<40%): ${restaurants.filter((r: any) => r.p_miss_cleaning <= 0.4).length} restaurants

Use the spatial analysis to see restaurant locations on the map for route planning.`,

          };
        }
      }

    } catch (error) {
      console.error('Error fetching data for chat response:', error);
    }

    // Default response with suggestions
    return {
      content: `I can help you analyze your grease trap operations! Try asking:

• "Show me the KPI overview" - Current performance metrics
• "Which outlets are high risk?" - Risk assessment and inspections  
• "Analyze performance by area" - Geographic insights
• "What's the forecast volume?" - Portfolio performance trends
• "Show me restaurant category analysis" - Category-specific insights

What would you like to know?`,

    };
  };

  const handleToolClick = (tool: ChatTool) => {
    // In production, this would execute the actual tool
    const toolMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "assistant",
      content: `Executing ${tool.name}... This would show actual data and charts in production.`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, toolMessage]);
  };

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case "BarChart3": return <BarChart3 className="h-4 w-4" />;
      case "TrendingUp": return <TrendingUp className="h-4 w-4" />;
      case "MapPin": return <MapPin className="h-4 w-4" />;
      case "AlertTriangle": return <AlertTriangle className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            AI Assistant & Explainability
          </h1>
          <p className="text-muted-foreground text-lg">
            Natural language queries, auto-rendering charts, and business insights
          </p>
        </div>

        {/* Chat Interface */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Chat Messages */}
          <div className="xl:col-span-3">
            <Card className="flex flex-col" style={{ height: 'calc(100vh - 300px)', minHeight: '500px' }}>
              <CardHeader className="flex-shrink-0">
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  AI Chat Assistant
                </CardTitle>
                <CardDescription>
                  Ask questions about your data, KPIs, and insights
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
                {/* Messages Area */}
                <div className="flex-1 overflow-hidden p-6 pb-4">
                  <ScrollArea className="h-full w-full" ref={scrollAreaRef}>
                    <div className="space-y-4 pr-4 pb-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${
                          message.role === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        {message.role === "assistant" && (
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <Bot className="h-4 w-4 text-blue-600" />
                          </div>
                        )}
                        
                        <div
                          className={`max-w-[85%] rounded-lg p-4 ${
                            message.role === "user"
                              ? "bg-blue-600 text-white"
                              : "bg-muted/50 border"
                          }`}
                        >
                          <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                          

                        </div>

                        {message.role === "user" && (
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                            <User className="h-4 w-4 text-gray-600" />
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {isLoading && (
                      <div className="flex gap-3 justify-start">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <Bot className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="bg-muted rounded-lg p-3">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>
                </div>

                {/* Input Area */}
                <div className="flex-shrink-0 border-t p-6 pt-4">
                  <div className="flex gap-2">
                    <Input
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Ask about KPIs, portfolio performance, geographic insights..."
                      disabled={isLoading}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim() || isLoading}
                      size="icon"
                      className="flex-shrink-0"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions & Examples */}
          <div className="xl:col-span-1">
            <div className="space-y-4 sticky top-4">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common queries and tools
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setInputValue("Show me the current KPI overview")}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  KPI Overview
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setInputValue("Analyze portfolio performance")}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Portfolio Analysis
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setInputValue("Show geographic insights")}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Geographic Insights
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setInputValue("Assess current risks")}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Risk Assessment
                </Button>
              </CardContent>
            </Card>

            {/* Example Queries */}
            <Card>
              <CardHeader>
                <CardTitle>Example Queries</CardTitle>
                <CardDescription>
                  Try these natural language questions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm space-y-2">
                  <p className="text-muted-foreground">"What are our top performing areas?"</p>
                  <p className="text-muted-foreground">"Show me outlets at high risk"</p>
                  <p className="text-muted-foreground">"Compare this month vs last month"</p>
                  <p className="text-muted-foreground">"Which categories need attention?"</p>
                  <p className="text-muted-foreground">"Show revenue trends"</p>
                </div>
              </CardContent>
            </Card>

            {/* AI Capabilities */}
            <Card>
              <CardHeader>
                <CardTitle>AI Capabilities</CardTitle>
                <CardDescription>
                  What I can help you with
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">KPI Analysis</Badge>
                    <Badge variant="secondary">Portfolio Insights</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Risk Assessment</Badge>
                    <Badge variant="secondary">Trend Analysis</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Geographic Data</Badge>
                    <Badge variant="secondary">Performance Metrics</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

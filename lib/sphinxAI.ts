// lib/sphinxAI.ts
import { Route, SphinxMessage } from './types';

export class SphinxAIClient {
  private apiEndpoint: string;
  private conversationHistory: SphinxMessage[];

  constructor() {
    this.apiEndpoint = '/api/sphinx';
    this.conversationHistory = [];
  }

  async chat(messages: SphinxMessage[], context?: any): Promise<string> {
    try {
      // Add to conversation history
      const newMessage = messages[messages.length - 1];
      this.conversationHistory.push(newMessage);

      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: newMessage.content,
          context,
          conversationHistory: this.conversationHistory,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Sphinx API error');
      }

      const data = await response.json();
      
      // Add response to history
      const assistantMessage: SphinxMessage = {
        role: 'assistant',
        content: data.response,
      };
      this.conversationHistory.push(assistantMessage);

      return data.response;
    } catch (error: any) {
      console.error('Sphinx AI Error:', error);
      throw error;
    }
  }

  async analyzeRoute(route: Route, allRoutes: Route[]): Promise<string> {
    return this.chat(
      [{
        role: 'user',
        content: 'Analyze the selected route considering CO2 emissions, energy consumption, and operating costs. Provide insights on its performance compared to other routes and explain if it is Pareto-optimal.'
      }],
      { selectedRoute: route, routes: allRoutes }
    );
  }

  async recommendRoute(routes: Route[], criteria: string): Promise<string> {
    return this.chat(
      [{
        role: 'user',
        content: `I need to choose an optimal route. My priority is: ${criteria}. Based on the route data, which route should I select and why? Consider trade-offs between CO2, cost, and energy.`
      }],
      { routes, criteria }
    );
  }

  async generateReport(route: Route, allRoutes: Route[]): Promise<string> {
    return this.chat(
      [{
        role: 'user',
        content: 'Generate a comprehensive executive report on this route optimization. Include: 1) Selected route performance metrics, 2) Comparison with alternatives, 3) Environmental impact, 4) Cost analysis, 5) Recommendations. Format it professionally for C-suite executives.'
      }],
      { route, routes: allRoutes }
    );
  }

  clearHistory() {
    this.conversationHistory = [];
  }
}
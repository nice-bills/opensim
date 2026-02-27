import { Character } from './types.js';

export interface PaymentRequest {
  from: string;
  to: string;
  amount: string;
  token: string;
  description?: string;
}

export interface PaymentResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

export class X402Payments {
  private pendingPayments: Map<string, PaymentRequest> = new Map();
  private balances: Map<string, string> = new Map();
  private readonly TOKEN = 'USDC';
  private readonly NETWORK = 'base';
  
  constructor() {
    console.log(`[x402] Initialized on ${this.NETWORK} with ${this.TOKEN}`);
  }
  
  async getBalance(walletAddress: string): Promise<string> {
    return this.balances.get(walletAddress) || '0';
  }
  
  async addFunds(walletAddress: string, amount: string): Promise<void> {
    const current = parseFloat(await this.getBalance(walletAddress));
    const newBalance = (current + parseFloat(amount)).toFixed(2);
    this.balances.set(walletAddress, newBalance);
    console.log(`[x402] Added ${amount} USDC to ${walletAddress.slice(0, 8)}... (balance: ${newBalance})`);
  }
  
  async createPaymentRequest(
    from: string,
    to: string,
    amount: string,
    description?: string
  ): Promise<PaymentRequest> {
    const request: PaymentRequest = {
      from,
      to,
      amount,
      token: this.TOKEN,
      description
    };
    
    const key = `${from}:${to}:${Date.now()}`;
    this.pendingPayments.set(key, request);
    
    return request;
  }
  
  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    try {
      const fromBalance = parseFloat(await this.getBalance(request.from));
      const amount = parseFloat(request.amount);
      
      if (fromBalance < amount) {
        return { success: false, error: 'Insufficient balance' };
      }
      
      this.balances.set(request.from, (fromBalance - amount).toFixed(2));
      
      const toBalance = parseFloat(await this.getBalance(request.to));
      this.balances.set(request.to, (toBalance + amount).toFixed(2));
      
      const txHash = `0x${Buffer.from(`${Date.now()}${Math.random()}`).toString('hex').slice(0, 64)}`;
      
      console.log(`[x402] Payment: ${request.from.slice(0, 8)}... → ${request.to.slice(0, 8)}... : ${request.amount} ${this.TOKEN}`);
      
      return { success: true, txHash };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Payment failed' 
      };
    }
  }
  
  async payAgent(fromId: string, toId: string, amount: string, fromWallet: string, toWallet: string): Promise<PaymentResult> {
    const fromBalance = parseFloat(await this.getBalance(fromWallet));
    const amountNum = parseFloat(amount);
    
    if (fromBalance < amountNum) {
      return { success: false, error: 'Insufficient balance' };
    }
    
    this.balances.set(fromWallet, (fromBalance - amountNum).toFixed(2));
    const toBalance = parseFloat(await this.getBalance(toWallet));
    this.balances.set(toWallet, (toBalance + amountNum).toFixed(2));
    
    return { success: true, txHash: `0x${Date.now().toString(16)}` };
  }
  
  getNetwork(): string {
    return this.NETWORK;
  }
  
  getToken(): string {
    return this.TOKEN;
  }
  
  getPendingPayments(): PaymentRequest[] {
    return Array.from(this.pendingPayments.values());
  }
}

export const x402 = new X402Payments();

// DecentralizedChatService.tsx
import { useState } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 🚀 类型定义
interface DecentralizedMessage {
    sender_id: string;
    message: string;
    timestamp: string;
    isDecentralized?: boolean;
}

interface SendResult {
    success: boolean;
    txHash?: string;
    blockNumber?: number;
    error?: string;
}

// 🚀 模拟的以太坊工具函数
class MockEthers {
    static isAddress(address: string): boolean {
        return /^0x[a-fA-F0-9]{40}$/.test(address);
    }

    static createRandomWallet() {
        const randomHex = () => Math.floor(Math.random() * 16).toString(16);
        const privateKey = '0x' + Array(64).fill(0).map(() => randomHex()).join('');
        const address = '0x' + Array(40).fill(0).map(() => randomHex()).join('');

        return {
            privateKey,
            address,
            signMessage: async (message: string) => {
                // 模拟签名
                return '0x' + Array(130).fill(0).map(() => randomHex()).join('');
            }
        };
    }

    static formatEther(balance: string): string {
        return (parseInt(balance) / 1e18).toFixed(4);
    }
}

// 🚀 模拟的区块链提供商
class MockProvider {
    async getBalance(address: string): Promise<string> {
        // 模拟返回余额
        return (Math.random() * 1e18).toString();
    }

    async getBlockNumber(): Promise<number> {
        return Math.floor(Math.random() * 1000000) + 1000000;
    }

    async resolveName(ensName: string): Promise<string | null> {
        // 模拟ENS解析
        if (ensName.endsWith('.eth')) {
            return '0x' + Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
        }
        return null;
    }
}

// 🚀 模拟的智能合约
class MockChatContract {
    private provider: MockProvider;
    private wallet: any;

    constructor(provider: MockProvider, wallet: any) {
        this.provider = provider;
        this.wallet = wallet;
    }

    async sendMessage(recipientAddress: string, message: string): Promise<any> {
        // 模拟发送交易
        console.log('📤 Mock: Sending message to contract...');

        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

        // 模拟交易哈希
        const txHash = '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');

        return {
            hash: txHash,
            wait: async () => {
                // 模拟等待确认
                await new Promise(resolve => setTimeout(resolve, 500));
                return {
                    blockNumber: await this.provider.getBlockNumber(),
                    transactionHash: txHash
                };
            }
        };
    }

    async getMessages(user1: string, user2: string): Promise<DecentralizedMessage[]> {
        // 模拟从区块链获取消息
        console.log('📥 Mock: Fetching messages from contract...');

        await new Promise(resolve => setTimeout(resolve, 500));

        // 返回模拟消息
        return [
            {
                sender_id: user2.toLowerCase(),
                message: "Hello from the blockchain! 🔗",
                timestamp: new Date(Date.now() - 120000).toISOString(),
                isDecentralized: true
            },
            {
                sender_id: user1.toLowerCase(),
                message: "Hey there! Decentralized chat is awesome! 🚀",
                timestamp: new Date(Date.now() - 60000).toISOString(),
                isDecentralized: true
            }
        ];
    }

    // 模拟事件监听
    on(eventName: string, callback: Function) {
        console.log(`📡 Mock: Listening for ${eventName} events...`);

        // 模拟接收新消息事件
        if (eventName === 'MessageSent') {
            setTimeout(() => {
                const mockEvent = {
                    from: '0x' + Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
                    to: this.wallet.address,
                    message: "New message from blockchain! 📨",
                    timestamp: Math.floor(Date.now() / 1000)
                };
                callback(mockEvent.from, mockEvent.to, mockEvent.message, mockEvent.timestamp);
            }, 5000 + Math.random() * 10000);
        }
    }

    removeAllListeners() {
        console.log('🔇 Mock: Removed all event listeners');
    }
}

// 🚀 去中心化聊天服务主类
class DecentralizedChatService {
    private provider: MockProvider | null = null;
    private wallet: any = null;
    private contract: MockChatContract | null = null;
    public isInitialized: boolean = false;

    // 初始化服务
    async initialize(): Promise<void> {
        try {
            console.log('🚀 Initializing Decentralized Chat Service...');

            // 1. 连接到区块链网络（模拟）
            this.provider = new MockProvider();

            // 2. 获取或创建用户钱包
            await this._initializeWallet();

            // 3. 连接智能合约（模拟）
            this.contract = new MockChatContract(this.provider, this.wallet);

            // 4. 确保钱包有足够余额（模拟）
            await this._ensureBalance();

            this.isInitialized = true;
            console.log('✅ Decentralized Chat Service initialized');
            console.log('📍 Wallet Address:', this.wallet.address);

        } catch (error) {
            console.error('❌ Failed to initialize Decentralized Chat Service:', error);
            throw error;
        }
    }

    // 获取或创建钱包
    private async _initializeWallet(): Promise<void> {
        try {
            // 尝试从本地存储获取私钥
            let privateKey = await AsyncStorage.getItem('decentralized_chat_private_key');

            if (!privateKey) {
                // 创建新钱包
                const wallet = MockEthers.createRandomWallet();
                privateKey = wallet.privateKey;

                // 保存私钥到本地存储
                await AsyncStorage.setItem('decentralized_chat_private_key', privateKey);
                await AsyncStorage.setItem('decentralized_chat_address', wallet.address);
                console.log('🔐 New wallet created and saved');

                this.wallet = wallet;
            } else {
                // 从存储的私钥恢复钱包
                const address = await AsyncStorage.getItem('decentralized_chat_address');
                this.wallet = {
                    privateKey,
                    address,
                    signMessage: async (message: string) => {
                        return '0x' + Array(130).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
                    }
                };
                console.log('🔐 Wallet restored from storage');
            }

        } catch (error) {
            console.error('Error initializing wallet:', error);
            throw error;
        }
    }

    // 确保钱包有足够余额
    private async _ensureBalance(): Promise<void> {
        try {
            if (!this.provider || !this.wallet) return;

            const balance = await this.provider.getBalance(this.wallet.address);
            const balanceInEth = MockEthers.formatEther(balance);

            console.log(`💰 Current balance: ${balanceInEth} ETH`);

            // 如果余额不足，显示警告（在实际应用中可以调用faucet）
            if (parseFloat(balanceInEth) < 0.01) {
                console.log('⚠️ Low balance detected. Consider topping up.');
            }

        } catch (error) {
            console.error('Error checking balance:', error);
        }
    }

    // 发送消息到区块链
    async sendMessage(recipientAddress: string, messageContent: string): Promise<SendResult> {
        if (!this.isInitialized || !this.contract) {
            throw new Error('Service not initialized');
        }

        try {
            console.log('📤 Sending message to blockchain...');
            console.log('To:', recipientAddress);
            console.log('Message:', messageContent);

            // 调用智能合约发送消息
            const tx = await this.contract.sendMessage(recipientAddress, messageContent);

            console.log('⏳ Transaction submitted:', tx.hash);

            // 等待交易确认
            const receipt = await tx.wait();

            console.log('✅ Message sent successfully! Block:', receipt.blockNumber);

            return {
                success: true,
                txHash: tx.hash,
                blockNumber: receipt.blockNumber
            };

        } catch (error) {
            console.error('❌ Failed to send message:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    // 获取与特定用户的聊天历史
    async getChatHistory(otherUserAddress: string): Promise<DecentralizedMessage[]> {
        if (!this.isInitialized || !this.contract || !this.wallet) {
            throw new Error('Service not initialized');
        }

        try {
            console.log('📥 Fetching chat history...');
            console.log('Between:', this.wallet.address, 'and', otherUserAddress);

            // 从智能合约获取消息
            const messages = await this.contract.getMessages(this.wallet.address, otherUserAddress);

            console.log('📨 Retrieved', messages.length, 'messages');
            return messages;

        } catch (error) {
            console.error('❌ Failed to fetch chat history:', error);
            throw error;
        }
    }

    // 获取当前用户的钱包地址
    getUserAddress(): string | null {
        return this.wallet ? this.wallet.address : null;
    }

    // 监听新消息（实时更新）
    setupMessageListener(callback: (message: DecentralizedMessage) => void): void {
        if (!this.contract || !this.wallet) return;

        // 监听MessageSent事件
        this.contract.on("MessageSent", (from: string, to: string, message: string, timestamp: number) => {
            const myAddress = this.wallet.address.toLowerCase();

            // 只处理发送给当前用户的消息
            if (to.toLowerCase() === myAddress || from.toLowerCase() === myAddress) {
                const newMessage: DecentralizedMessage = {
                    sender_id: from.toLowerCase(),
                    message: message,
                    timestamp: new Date(Number(timestamp) * 1000).toISOString(),
                    isDecentralized: true
                };

                console.log('📨 New message received:', newMessage);
                callback(newMessage);
            }
        });
    }

    // 清理监听器
    cleanup(): void {
        if (this.contract) {
            this.contract.removeAllListeners();
        }
    }

    // 验证地址格式
    static isValidAddress(address: string): boolean {
        return MockEthers.isAddress(address);
    }

    // 获取余额
    async getBalance(): Promise<string> {
        if (!this.provider || !this.wallet) return '0';

        try {
            const balance = await this.provider.getBalance(this.wallet.address);
            return MockEthers.formatEther(balance);
        } catch (error) {
            console.error('Error getting balance:', error);
            return '0';
        }
    }
}

// 导出单例实例
export const decentralizedChatService = new DecentralizedChatService();

// 🚀 React Hook for 去中心化聊天
export const useDecentralizedChat = () => {
    const [isDecentralizedMode, setIsDecentralizedMode] = useState(false);
    const [isInitializing, setIsInitializing] = useState(false);
    const [userAddress, setUserAddress] = useState<string | null>(null);
    const [balance, setBalance] = useState<string>('0');

    // 切换到去中心化模式
    const enableDecentralizedMode = async (): Promise<void> => {
        try {
            setIsInitializing(true);

            if (!decentralizedChatService.isInitialized) {
                await decentralizedChatService.initialize();
            }

            const address = decentralizedChatService.getUserAddress();
            const currentBalance = await decentralizedChatService.getBalance();

            setUserAddress(address);
            setBalance(currentBalance);
            setIsDecentralizedMode(true);

            console.log('✅ Decentralized mode enabled');

        } catch (error) {
            console.error('Failed to enable decentralized mode:', error);
            Alert.alert('Error', 'Failed to connect to decentralized network. Please try again.');
            throw error;
        } finally {
            setIsInitializing(false);
        }
    };

    // 发送去中心化消息
    const sendDecentralizedMessage = async (recipientAddress: string, message: string): Promise<SendResult> => {
        try {
            if (!DecentralizedChatService.isValidAddress(recipientAddress)) {
                throw new Error('Invalid recipient address');
            }

            const result = await decentralizedChatService.sendMessage(recipientAddress, message);

            // 更新余额
            const newBalance = await decentralizedChatService.getBalance();
            setBalance(newBalance);

            return result;
        } catch (error) {
            console.error('Failed to send decentralized message:', error);
            throw error;
        }
    };

    // 获取去中心化聊天历史
    const getDecentralizedHistory = async (otherUserAddress: string): Promise<DecentralizedMessage[]> => {
        try {
            if (!DecentralizedChatService.isValidAddress(otherUserAddress)) {
                console.warn('Invalid address, returning empty history');
                return [];
            }

            const messages = await decentralizedChatService.getChatHistory(otherUserAddress);
            return messages;
        } catch (error) {
            console.error('Failed to get decentralized history:', error);
            return [];
        }
    };

    // 设置消息监听器
    const setupMessageListener = (callback: (message: DecentralizedMessage) => void): void => {
        decentralizedChatService.setupMessageListener(callback);
    };

    // 清理资源
    const cleanup = (): void => {
        decentralizedChatService.cleanup();
    };

    return {
        isDecentralizedMode,
        isInitializing,
        userAddress,
        balance,
        enableDecentralizedMode,
        sendDecentralizedMessage,
        getDecentralizedHistory,
        setupMessageListener,
        cleanup,
        setIsDecentralizedMode
    };
};

// 🚀 工具函数
export const DecentralizedChatUtils = {
    // 格式化地址显示
    formatAddress: (address: string): string => {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    },

    // 验证地址
    isValidAddress: (address: string): boolean => {
        return DecentralizedChatService.isValidAddress(address);
    },

    // 生成聊天ID
    generateChatId: (address1: string, address2: string): string => {
        const addresses = [address1.toLowerCase(), address2.toLowerCase()].sort();
        return `decentralized_${addresses[0]}_${addresses[1]}`;
    },

    // 检查是否为去中心化消息
    isDecentralizedMessage: (message: any): boolean => {
        return message && message.isDecentralized === true;
    }
};

export default DecentralizedChatService;
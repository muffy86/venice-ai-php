/**
 * Blockchain Automation Ledger
 * Decentralized automation tracking and smart contracts
 */

class BlockchainAutomationLedger {
    constructor() {
        this.chain = [];
        this.pendingTransactions = [];
        this.smartContracts = new Map();
        this.validators = new Set();
        this.difficulty = 4;
        this.miningReward = 10;
        this.init();
    }

    init() {
        this.createGenesisBlock();
        this.setupSmartContracts();
        this.startConsensus();
    }

    // Setup smart contracts infrastructure
    setupSmartContracts() {
        // Deploy core governance contract
        this.deployGovernanceContract();
        
        // Deploy automation marketplace contract
        this.deployMarketplaceContract();
        
        // Deploy staking contract
        this.deployStakingContract();
        
        // Setup contract execution environment
        this.setupExecutionEnvironment();
    }

    deployGovernanceContract() {
        const governanceCode = `
            contract Governance {
                struct Proposal {
                    string title;
                    string description;
                    string automationCode;
                    uint256 votingDeadline;
                    uint256 yesVotes;
                    uint256 noVotes;
                    bool executed;
                }
                
                mapping(uint256 => Proposal) public proposals;
                mapping(uint256 => mapping(address => bool)) public hasVoted;
                uint256 public proposalCount;
                
                function propose(string memory title, string memory description, string memory code) public returns (uint256) {
                    proposalCount++;
                    proposals[proposalCount] = Proposal(title, description, code, block.timestamp + 7 days, 0, 0, false);
                    return proposalCount;
                }
                
                function vote(uint256 proposalId, bool support) public {
                    require(!hasVoted[proposalId][msg.sender], "Already voted");
                    hasVoted[proposalId][msg.sender] = true;
                    
                    if (support) {
                        proposals[proposalId].yesVotes++;
                    } else {
                        proposals[proposalId].noVotes++;
                    }
                }
            }
        `;
        
        const governanceAddress = this.deploySmartContract(governanceCode, {});
        this.smartContracts.set('governance', this.smartContracts.get(governanceAddress));
    }

    deployMarketplaceContract() {
        const marketplaceCode = `
            contract AutomationMarketplace {
                struct Automation {
                    string name;
                    string description;
                    uint256 price;
                    address creator;
                    bool active;
                }
                
                mapping(uint256 => Automation) public automations;
                uint256 public automationCount;
                
                function listAutomation(string memory name, string memory description, uint256 price) public returns (uint256) {
                    automationCount++;
                    automations[automationCount] = Automation(name, description, price, msg.sender, true);
                    return automationCount;
                }
                
                function purchaseAutomation(uint256 automationId) public payable {
                    require(automations[automationId].active, "Automation not active");
                    require(msg.value >= automations[automationId].price, "Insufficient payment");
                    // Transfer ownership logic here
                }
            }
        `;
        
        const marketplaceAddress = this.deploySmartContract(marketplaceCode, {});
        this.smartContracts.set('marketplace', this.smartContracts.get(marketplaceAddress));
    }

    deployStakingContract() {
        const stakingCode = `
            contract Staking {
                mapping(address => uint256) public stakes;
                mapping(address => bool) public validators;
                uint256 public totalStaked;
                
                function stake() public payable {
                    stakes[msg.sender] += msg.value;
                    totalStaked += msg.value;
                    
                    if (stakes[msg.sender] >= 1000) { // Minimum stake for validation
                        validators[msg.sender] = true;
                    }
                }
                
                function unstake(uint256 amount) public {
                    require(stakes[msg.sender] >= amount, "Insufficient stake");
                    stakes[msg.sender] -= amount;
                    totalStaked -= amount;
                    
                    if (stakes[msg.sender] < 1000) {
                        validators[msg.sender] = false;
                    }
                }
            }
        `;
        
        const stakingAddress = this.deploySmartContract(stakingCode, {});
        this.smartContracts.set('staking', this.smartContracts.get(stakingAddress));
    }

    setupExecutionEnvironment() {
        this.contractVM = {
            gasLimit: 1000000,
            gasPrice: 1,
            storage: new Map(),
            logs: []
        };
    }

    // Blockchain core
    createGenesisBlock() {
        try {
            const genesis = new Block(0, Date.now(), [], "0");
            genesis.hash = this.calculateHash(genesis);
            this.chain.push(genesis);
        } catch (error) {
            console.warn('Error creating genesis block:', error);
            // Fallback genesis block
            this.chain.push({
                index: 0,
                timestamp: Date.now(),
                transactions: [],
                previousHash: "0",
                hash: "genesis"
            });
        }
    }

    createBlock(transactions) {
        try {
            const block = new Block(
                this.chain.length,
                Date.now(),
                transactions,
                this.getLatestBlock().hash
            );
            
            block.mineBlock(this.difficulty);
            return block;
        } catch (error) {
            console.warn('Error creating block:', error);
            // Fallback block
            return {
                index: this.chain.length,
                timestamp: Date.now(),
                transactions: transactions || [],
                previousHash: this.getLatestBlock()?.hash || "0",
                hash: "fallback_" + Date.now()
            };
        }
    }

    addBlock(block) {
        if (this.isValidBlock(block, this.getLatestBlock())) {
            this.chain.push(block);
            this.pendingTransactions = [];
            return true;
        }
        return false;
    }

    // Automation tracking on blockchain
    async recordAutomation(automation) {
        try {
            const transaction = new AutomationTransaction({
                id: automation.id,
                type: 'automation_created',
                data: {
                    name: automation.name,
                    trigger: automation.trigger,
                    action: automation.action,
                    creator: automation.creator,
                    timestamp: Date.now()
                }
            });

            this.pendingTransactions.push(transaction);
            
            if (this.pendingTransactions.length >= 10) {
                await this.mineBlock();
            }

            return transaction.hash;
        } catch (error) {
            console.warn('Error recording automation:', error);
            // Fallback transaction
            const fallbackTransaction = {
                id: automation.id,
                type: 'automation_created',
                data: automation,
                hash: 'fallback_' + Date.now()
            };
            this.pendingTransactions.push(fallbackTransaction);
            return fallbackTransaction.hash;
        }
    }

    async recordExecution(executionId, result) {
        const transaction = new AutomationTransaction({
            id: executionId,
            type: 'automation_executed',
            data: {
                result: result.status,
                duration: result.duration,
                timestamp: Date.now(),
                gasUsed: this.calculateGasUsed(result)
            }
        });

        this.pendingTransactions.push(transaction);
        return transaction.hash;
    }

    // Smart contracts for automation
    deploySmartContract(contractCode, params) {
        const contract = new SmartContract(contractCode, params);
        this.smartContracts.set(contract.address, contract);
        
        const transaction = new AutomationTransaction({
            type: 'contract_deployed',
            data: {
                address: contract.address,
                code: contractCode,
                params,
                timestamp: Date.now()
            }
        });

        this.pendingTransactions.push(transaction);
        return contract.address;
    }

    async executeSmartContract(address, method, params) {
        const contract = this.smartContracts.get(address);
        if (!contract) throw new Error('Contract not found');

        const result = await contract.execute(method, params);
        
        await this.recordExecution(`contract_${address}_${method}`, {
            status: 'success',
            result,
            duration: result.executionTime,
            gasUsed: result.gasUsed
        });

        return result;
    }

    // Decentralized automation governance
    async proposeAutomation(proposal) {
        const governanceContract = this.smartContracts.get('governance');
        if (!governanceContract) {
            throw new Error('Governance contract not deployed');
        }

        return await this.executeSmartContract('governance', 'propose', {
            title: proposal.title,
            description: proposal.description,
            automationCode: proposal.code,
            votingPeriod: proposal.votingPeriod || 7 * 24 * 60 * 60 * 1000 // 7 days
        });
    }

    async voteOnProposal(proposalId, vote, voterAddress) {
        return await this.executeSmartContract('governance', 'vote', {
            proposalId,
            vote, // 'yes', 'no', 'abstain'
            voter: voterAddress
        });
    }

    // Consensus mechanism (Proof of Stake)
    startConsensus() {
        setInterval(() => {
            if (this.pendingTransactions.length > 0) {
                this.selectValidator();
            }
        }, 30000); // Every 30 seconds
    }

    selectValidator() {
        const validators = Array.from(this.validators);
        if (validators.length === 0) return;

        // Weighted random selection based on stake
        const totalStake = validators.reduce((sum, v) => sum + v.stake, 0);
        const random = Math.random() * totalStake;
        let cumulative = 0;

        for (const validator of validators) {
            cumulative += validator.stake;
            if (random <= cumulative) {
                this.proposeBlock(validator);
                break;
            }
        }
    }

    async proposeBlock(validator) {
        const block = this.createBlock([...this.pendingTransactions]);
        
        // Simulate network consensus
        const votes = await this.collectVotes(block);
        const approvalRate = votes.yes / (votes.yes + votes.no);
        
        if (approvalRate > 0.66) { // 2/3 majority
            this.addBlock(block);
            this.rewardValidator(validator, this.miningReward);
        }
    }

    async collectVotes(block) {
        // Simulate validator voting
        const votes = { yes: 0, no: 0 };
        
        for (const validator of this.validators) {
            const vote = await this.validateBlock(block, validator);
            votes[vote ? 'yes' : 'no']++;
        }
        
        return votes;
    }

    // Automation marketplace
    createAutomationMarketplace() {
        const marketplaceCode = `
            contract AutomationMarketplace {
                mapping(address => Automation[]) public automations;
                mapping(bytes32 => Purchase) public purchases;
                
                struct Automation {
                    string name;
                    string description;
                    uint256 price;
                    address creator;
                    bool active;
                }
                
                struct Purchase {
                    address buyer;
                    bytes32 automationId;
                    uint256 timestamp;
                }
                
                function listAutomation(string memory name, string memory description, uint256 price) public {
                    automations[msg.sender].push(Automation(name, description, price, msg.sender, true));
                }
                
                function purchaseAutomation(bytes32 automationId) public payable {
                    // Purchase logic
                    purchases[automationId] = Purchase(msg.sender, automationId, block.timestamp);
                }
                
                function executeAutomation(bytes32 automationId) public {
                    // Execution logic
                }
            }
        `;

        return this.deploySmartContract(marketplaceCode, {});
    }

    // Analytics and insights
    getAutomationAnalytics() {
        const analytics = {
            totalAutomations: 0,
            totalExecutions: 0,
            successRate: 0,
            gasUsage: 0,
            topCreators: new Map(),
            executionTrends: []
        };

        for (const block of this.chain) {
            for (const tx of block.transactions) {
                if (tx.type === 'automation_created') {
                    analytics.totalAutomations++;
                    
                    const creator = tx.data.creator;
                    analytics.topCreators.set(creator, 
                        (analytics.topCreators.get(creator) || 0) + 1
                    );
                }
                
                if (tx.type === 'automation_executed') {
                    analytics.totalExecutions++;
                    analytics.gasUsage += tx.data.gasUsed || 0;
                    
                    if (tx.data.result === 'success') {
                        analytics.successRate++;
                    }
                }
            }
        }

        analytics.successRate = analytics.totalExecutions > 0 ? 
            analytics.successRate / analytics.totalExecutions : 0;

        return analytics;
    }

    // Utility methods
    calculateHash(block) {
        return this.sha256(
            block.index + 
            block.previousHash + 
            block.timestamp + 
            JSON.stringify(block.transactions) + 
            block.nonce
        );
    }

    sha256(data) {
        // Simplified hash function (use crypto.subtle.digest in production)
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(16);
    }

    isValidBlock(block, previousBlock) {
        if (block.previousHash !== previousBlock.hash) return false;
        if (block.hash !== this.calculateHash(block)) return false;
        if (!block.hash.startsWith('0'.repeat(this.difficulty))) return false;
        return true;
    }

    calculateGasUsed(result) {
        // Simple gas calculation based on execution complexity
        let gas = 21000; // Base gas
        gas += result.duration * 10; // Time-based gas
        gas += JSON.stringify(result).length; // Data size gas
        return gas;
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    // Public API
    async createAutomation(automation) {
        return await this.recordAutomation(automation);
    }

    async trackExecution(executionId, result) {
        return await this.recordExecution(executionId, result);
    }

    getChainInfo() {
        return {
            length: this.chain.length,
            difficulty: this.difficulty,
            pendingTransactions: this.pendingTransactions.length,
            validators: this.validators.size,
            smartContracts: this.smartContracts.size
        };
    }

    getAutomationHistory(automationId) {
        const history = [];
        
        for (const block of this.chain) {
            for (const tx of block.transactions) {
                if (tx.id === automationId) {
                    history.push({
                        type: tx.type,
                        data: tx.data,
                        timestamp: tx.timestamp,
                        blockIndex: block.index
                    });
                }
            }
        }
        
        return history;
    }
}

// Block class
class Block {
    constructor(index, timestamp, transactions, previousHash) {
        this.index = index;
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.previousHash = previousHash;
        this.nonce = 0;
        this.hash = '';
    }

    mineBlock(difficulty) {
        const target = '0'.repeat(difficulty);
        
        while (this.hash.substring(0, difficulty) !== target) {
            this.nonce++;
            this.hash = this.calculateHash();
        }
    }

    calculateHash() {
        const ledger = window.blockchainLedger || new BlockchainAutomationLedger();
        return ledger.sha256(
            this.index + 
            this.previousHash + 
            this.timestamp + 
            JSON.stringify(this.transactions) + 
            this.nonce
        );
    }
}

// Transaction class
class AutomationTransaction {
    constructor(data) {
        this.id = data.id;
        this.type = data.type;
        this.data = data.data;
        this.timestamp = Date.now();
        this.hash = this.calculateHash();
    }

    calculateHash() {
        const ledger = window.blockchainLedger || new BlockchainAutomationLedger();
        return ledger.sha256(JSON.stringify({
            id: this.id,
            type: this.type,
            data: this.data,
            timestamp: this.timestamp
        }));
    }
}

// Smart Contract class
class SmartContract {
    constructor(code, params) {
        this.address = this.generateAddress();
        this.code = code;
        this.params = params;
        this.state = {};
        this.gasLimit = 1000000;
    }

    async execute(method, params) {
        const startTime = Date.now();
        let gasUsed = 21000; // Base gas
        
        try {
            // Simplified contract execution
            const result = await this.executeMethod(method, params);
            
            const executionTime = Date.now() - startTime;
            gasUsed += executionTime * 10;
            
            return {
                success: true,
                result,
                executionTime,
                gasUsed
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                executionTime: Date.now() - startTime,
                gasUsed
            };
        }
    }

    async executeMethod(method, params) {
        // Simplified method execution
        switch (method) {
            case 'propose':
                return this.handleProposal(params);
            case 'vote':
                return this.handleVote(params);
            default:
                throw new Error(`Unknown method: ${method}`);
        }
    }

    handleProposal(params) {
        const proposalId = this.generateProposalId();
        this.state[proposalId] = {
            ...params,
            votes: { yes: 0, no: 0, abstain: 0 },
            status: 'active',
            created: Date.now()
        };
        return proposalId;
    }

    handleVote(params) {
        const proposal = this.state[params.proposalId];
        if (!proposal) throw new Error('Proposal not found');
        
        proposal.votes[params.vote]++;
        return { success: true, votes: proposal.votes };
    }

    generateAddress() {
        return '0x' + Math.random().toString(16).substr(2, 40);
    }

    generateProposalId() {
        return 'prop_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}

// Initialize and expose globally
window.BlockchainAutomationLedger = BlockchainAutomationLedger;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.blockchainLedger = new BlockchainAutomationLedger();
    });
} else {
    window.blockchainLedger = new BlockchainAutomationLedger();
}
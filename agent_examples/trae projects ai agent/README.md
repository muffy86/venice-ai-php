# AI Agent Workforce System

A sophisticated browser-based multi-agent AI system that creates a collaborative workforce of specialized AI agents capable of handling complex tasks autonomously.

## 🚀 Features

### Core Capabilities
- **Multi-Agent Architecture**: Deploy specialized agents for different domains (coding, research, automation, vision, etc.)
- **Hybrid AI Integration**: Combines AI/ML/SLM/LLM/AR with computer vision and multi-modal processing
- **OpenRouter API Integration**: Access to multiple LLM models with free tier support
- **ElevenLabs Voice Integration**: Natural voice interaction and text-to-speech
- **Autonomous Operation**: Agents can work independently with configurable autonomy levels
- **Real-time Collaboration**: Agents can collaborate on complex multi-step tasks

### Specialized Modules
- **Vision Processing**: Object detection, face recognition, OCR, and image analysis
- **Research Engine**: Web search, academic research, news monitoring with intelligent caching
- **Automation Engine**: Workflow orchestration, task scheduling, and trigger-based actions
- **Code Generation**: Advanced coding assistance with multiple language support
- **Data Analysis**: Statistical analysis, visualization, and pattern recognition

### User Interface
- **Modern Dark Theme**: Professional and eye-friendly interface
- **Multiple Workspaces**: Dedicated spaces for different types of work
- **Real-time Chat**: Natural language interaction with the agent workforce
- **Voice Control**: Hands-free operation with voice commands
- **System Monitoring**: Real-time health and performance metrics

## 🛠️ Setup

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection for API access
- Microphone (optional, for voice features)
- Camera (optional, for vision features)

### Installation
1. Clone or download this repository
2. Open `index.html` in your web browser
3. Configure API keys (see Configuration section)

### Configuration

#### Required API Keys
1. **OpenRouter API Key** (Required)
   - Visit [OpenRouter.ai](https://openrouter.ai)
   - Create an account and generate an API key
   - Add to `js/config.js` or through the UI settings

2. **ElevenLabs API Key** (Optional, for voice features)
   - Visit [ElevenLabs.io](https://elevenlabs.io)
   - Create an account and generate an API key
   - Add to `js/config.js` or through the UI settings

#### Configuration File
Edit `js/config.js` to customize:
```javascript
const CONFIG = {
    apis: {
        openRouter: {
            apiKey: 'YOUR_OPENROUTER_API_KEY',
            baseUrl: 'https://openrouter.ai/api/v1',
            defaultModel: 'meta-llama/llama-3.1-8b-instruct:free'
        },
        elevenLabs: {
            apiKey: 'YOUR_ELEVENLABS_API_KEY',
            voiceId: 'default'
        }
    }
    // ... other settings
};
```

## 🎯 Usage

### Basic Commands
- **Chat naturally**: Just type your request and agents will handle it
- **`/spawn [type]`**: Create a new specialized agent
- **`/help`**: Show all available commands
- **`/status`**: Display system status
- **`/clear`**: Clear chat history

### Agent Types
- **general**: General-purpose assistant
- **coding**: Programming and development expert
- **research**: Web research and analysis specialist
- **automation**: Workflow and task automation
- **vision**: Computer vision and image processing
- **data**: Data analysis and visualization
- **security**: Cybersecurity and safety analysis
- **design**: UI/UX and creative design
- **devops**: Infrastructure and deployment
- **qa**: Quality assurance and testing

### Workspaces
1. **Overview**: System dashboard and agent management
2. **Code**: Development environment with syntax highlighting
3. **Research**: Web research tools and knowledge base
4. **Vision**: Computer vision and image processing
5. **Automation**: Workflow designer and task scheduler

### Voice Commands
- **"Hey AI"**: Activate voice input
- **"Stop listening"**: Deactivate voice input
- **"Read that"**: Have the system read the last response
- **"Spawn [agent type]"**: Create a new agent via voice

## 🏗️ Architecture

### Core Components
```
├── js/
│   ├── config.js       # System configuration
│   ├── agents.js       # Agent management and AI logic
│   ├── specialized.js  # Vision, research, and automation modules
│   ├── ui.js          # User interface management
│   └── app.js         # Main application controller
├── css/
│   └── styles.css     # Complete styling
└── index.html         # Main interface
```

### Agent Lifecycle
1. **Spawning**: Agents are created with specific capabilities and autonomy levels
2. **Task Assignment**: Tasks are automatically routed to appropriate agents
3. **Execution**: Agents process tasks using their specialized capabilities
4. **Collaboration**: Multiple agents can work together on complex tasks
5. **Learning**: Agents improve through interaction and feedback

### Data Flow
```
User Input → UI Manager → Agent Manager → Specialized Modules → LLM APIs → Response Processing → UI Update
```

## 🔧 Advanced Features

### Automation Workflows
Create complex workflows with:
- **Triggers**: Time-based, event-based, or condition-based
- **Actions**: API calls, data transformations, agent tasks
- **Conditions**: Logical branching and decision making
- **Loops**: Iterative processing and batch operations

### Vision Processing
- **Object Detection**: Identify and classify objects in images
- **Face Recognition**: Detect and analyze faces
- **OCR**: Extract text from images and documents
- **Scene Analysis**: Understand image context and content

### Research Capabilities
- **Multi-source Search**: Web, academic, news, and specialized databases
- **Content Analysis**: Summarization, fact-checking, and relevance scoring
- **Citation Management**: Automatic source tracking and referencing
- **Knowledge Graphs**: Build and maintain topic relationships

## 🛡️ Security & Privacy

### Data Protection
- **Local Processing**: Most operations happen in your browser
- **API Security**: Secure communication with external services
- **No Data Storage**: Conversations are not permanently stored by default
- **User Control**: Full control over data sharing and retention

### Safeguards
- **Configurable Autonomy**: Set limits on agent independence
- **Content Filtering**: Optional content moderation
- **Rate Limiting**: Prevent API abuse and excessive usage
- **Error Handling**: Robust error recovery and user notification

## 🎨 Customization

### Themes
- Modify `css/styles.css` for visual customization
- Dark/light theme toggle available
- Responsive design for all screen sizes

### Agent Personalities
- Customize agent behavior in `js/config.js`
- Add new agent types and capabilities
- Modify conversation styles and responses

### Workflow Templates
- Create reusable automation templates
- Share workflows between users
- Import/export workflow configurations

## 🐛 Troubleshooting

### Common Issues
1. **API Key Errors**: Ensure keys are correctly configured and have sufficient credits
2. **Browser Compatibility**: Use a modern browser with JavaScript enabled
3. **Performance Issues**: Clear browser cache and reduce concurrent agents
4. **Voice Not Working**: Check microphone permissions and browser support

### Debug Mode
Enable debug mode in `js/config.js`:
```javascript
CONFIG.system.debug = true;
```

### Performance Optimization
- Limit concurrent agents (default: 10)
- Reduce conversation history length
- Disable unused features (voice, vision)
- Use faster LLM models for simple tasks

## 📈 Monitoring

### System Health
- **Agent Status**: Active, idle, error states
- **Memory Usage**: Browser memory consumption
- **API Usage**: Request counts and rate limits
- **Performance**: Response times and throughput

### Metrics Dashboard
- Real-time system statistics
- Agent performance analytics
- Task completion rates
- Error tracking and reporting

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Make your changes
3. Test thoroughly in multiple browsers
4. Submit a pull request

### Code Style
- Use ES6+ JavaScript features
- Follow existing naming conventions
- Add comments for complex logic
- Maintain responsive design principles

## 📄 License

This project is open source and available under the MIT License.

## 🆘 Support

For issues, questions, or feature requests:
1. Check the troubleshooting section
2. Review existing issues on GitHub
3. Create a new issue with detailed information
4. Join our community discussions

## 🔮 Roadmap

### Upcoming Features
- **Plugin System**: Third-party integrations and extensions
- **Team Collaboration**: Multi-user agent sharing
- **Advanced Analytics**: Detailed performance insights
- **Mobile App**: Native mobile applications
- **Cloud Sync**: Cross-device synchronization
- **Enterprise Features**: Advanced security and management tools

---

**Built with ❤️ for the AI community**

*Empowering users with intelligent, autonomous AI agents that work together to solve complex problems and automate repetitive tasks.*
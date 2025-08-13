# Advanced Cognitive AI Framework

A comprehensive artificial intelligence system that implements human-like cognitive processes, consciousness simulation, and advanced emotional intelligence.

## 🧠 System Overview

This framework consists of four main components:

1. **Cognitive AI Framework** (`cognitive_ai_framework.py`) - Core cognitive architecture with reasoning, memory, and learning
2. **Advanced Consciousness Model** (`advanced_consciousness_model.py`) - Consciousness simulation and self-awareness
3. **Emotional Intelligence System** (`emotional_intelligence_system.py`) - Basic emotion recognition and regulation
4. **Advanced Emotional AI** (`advanced_emotional_ai.py`) - Cultural intelligence and therapeutic capabilities

## 🚀 Features

### Cognitive Architecture
- **Multiple Cognitive Models**: ACT-R, SOAR, CLARION architectures
- **Advanced Memory Systems**: Working memory with decay, long-term episodic and semantic memory
- **Reasoning Engine**: Deductive, inductive, abductive, analogical, and causal reasoning
- **Attention Mechanisms**: Focused, divided, and selective attention with capacity management
- **Metacognition**: Self-reflection and strategy optimization
- **Cognitive Bias Simulation**: Confirmation, availability, anchoring, and representativeness biases

### Consciousness Simulation
- **Global Workspace Theory**: Information integration and broadcasting
- **Integrated Information Theory (IIT)**: Consciousness measurement with Φ (phi) calculations
- **Attention Schema Theory**: Self-awareness and attention modeling
- **Consciousness Metrics**: Real-time monitoring of awareness levels and cognitive states

### Emotional Intelligence
- **Multi-modal Emotion Recognition**: Text, audio, and visual emotion detection
- **Cultural Intelligence**: Cross-cultural emotion understanding and adaptation
- **Therapeutic Capabilities**: Mental health assessment and intervention delivery
- **Group Emotion Dynamics**: Emotional contagion and collective emotion modeling
- **Emotional Memory**: Episodic and semantic emotional memory with consolidation

### Advanced Features
- **Real-time Monitoring**: Prometheus metrics for all cognitive processes
- **Asynchronous Processing**: Background tasks for memory consolidation and learning
- **RESTful API**: FastAPI endpoints for system interaction
- **Vector Search**: Qdrant integration for semantic memory retrieval
- **Neural Networks**: PyTorch-based emotion modeling and prediction

## 📋 Requirements

Install all dependencies using:

```bash
pip install -r requirements.txt
```

### Key Dependencies
- **AI/ML**: PyTorch, Transformers, scikit-learn, TensorFlow
- **NLP**: spaCy, NLTK, sentence-transformers
- **Computer Vision**: OpenCV, face-recognition
- **Audio**: librosa, soundfile
- **Vector DB**: Qdrant, FAISS, ChromaDB
- **Web**: FastAPI, uvicorn
- **Monitoring**: Prometheus, structlog

## 🛠️ Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd advanced-cognitive-ai
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Download required models:
```bash
python -c "import spacy; spacy.cli.download('en_core_web_sm')"
python -c "import nltk; nltk.download('vader_lexicon')"
```

## 🚀 Quick Start

### Basic Cognitive AI Usage

```python
from cognitive_ai_framework import CognitiveAIFramework, CognitiveArchitecture

# Initialize the cognitive system
cognitive_ai = CognitiveAIFramework(
    architecture=CognitiveArchitecture.ACT_R,
    working_memory_capacity=7,
    attention_capacity=3
)

# Start background processes
await cognitive_ai.start()

# Process input and get cognitive response
response = await cognitive_ai.process_input(
    "What is the relationship between climate change and ocean temperatures?"
)

print(f"Response: {response['response']}")
print(f"Confidence: {response['confidence']}")
print(f"Reasoning: {response['reasoning_trace']}")
```

### Advanced Emotional AI Usage

```python
from advanced_emotional_ai import AdvancedEmotionalAI

# Initialize emotional AI system
emotional_ai = AdvancedEmotionalAI()
await emotional_ai.initialize()

# Analyze emotions with cultural context
result = await emotional_ai.analyze_emotion(
    text="I'm feeling overwhelmed with work",
    cultural_context="Western",
    personality_traits={"neuroticism": 0.7, "extraversion": 0.3}
)

print(f"Primary emotion: {result['primary_emotion']}")
print(f"Cultural insights: {result['cultural_insights']}")
print(f"Therapeutic recommendations: {result['therapeutic_recommendations']}")
```

### Consciousness Model Usage

```python
from advanced_consciousness_model import AdvancedConsciousnessModel

# Initialize consciousness model
consciousness = AdvancedConsciousnessModel()
await consciousness.initialize()

# Process conscious experience
experience = await consciousness.process_conscious_experience(
    sensory_input="Beautiful sunset over the ocean",
    internal_state={"mood": "contemplative", "energy": 0.6}
)

print(f"Consciousness level: {experience['consciousness_level']}")
print(f"Self-awareness: {experience['self_awareness_level']}")
print(f"Integrated information (Φ): {experience['phi_value']}")
```

## 🌐 API Endpoints

Start the FastAPI server:

```bash
python advanced_emotional_ai.py
```

### Available Endpoints

- `POST /analyze_emotion` - Analyze emotions in text with cultural context
- `POST /start_session` - Start a new therapeutic session
- `POST /join_group` - Join a group emotion session
- `GET /metrics` - Get system performance metrics
- `GET /health` - Health check endpoint

### Example API Usage

```bash
# Analyze emotion
curl -X POST "http://localhost:8000/analyze_emotion" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "I am feeling anxious about the presentation",
    "cultural_context": "Western",
    "personality_traits": {"neuroticism": 0.8}
  }'

# Get system metrics
curl "http://localhost:8000/metrics"
```

## 📊 Monitoring and Metrics

The system provides comprehensive monitoring through Prometheus metrics:

- **Cognitive Metrics**: Reasoning accuracy, memory usage, attention focus
- **Emotional Metrics**: Emotion recognition accuracy, cultural adaptation success
- **Consciousness Metrics**: Awareness levels, information integration (Φ values)
- **Performance Metrics**: Processing latency, memory consumption, API response times

Access metrics at: `http://localhost:8000/metrics`

## 🧪 Testing

Run the test suite:

```bash
pytest tests/ -v
```

Run specific test categories:

```bash
# Test cognitive reasoning
pytest tests/test_cognitive_reasoning.py -v

# Test emotional intelligence
pytest tests/test_emotional_ai.py -v

# Test consciousness model
pytest tests/test_consciousness.py -v
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file:

```env
# Database Configuration
QDRANT_HOST=localhost
QDRANT_PORT=6333
REDIS_URL=redis://localhost:6379

# Model Configuration
HUGGINGFACE_TOKEN=your_token_here
OPENAI_API_KEY=your_key_here

# Monitoring
PROMETHEUS_PORT=9090
LOG_LEVEL=INFO

# Cultural Intelligence
DEFAULT_CULTURE=Western
ENABLE_CULTURAL_ADAPTATION=true

# Therapeutic Settings
ENABLE_THERAPEUTIC_MODE=true
CRISIS_INTERVENTION_ENABLED=true
```

### System Configuration

Modify `config.yaml` for advanced settings:

```yaml
cognitive_architecture:
  default: "ACT_R"
  working_memory_capacity: 7
  attention_capacity: 3
  
emotional_intelligence:
  cultural_profiles: ["Western", "Eastern", "African", "Latin"]
  therapeutic_approaches: ["CBT", "DBT", "Mindfulness", "Psychodynamic"]
  
consciousness:
  phi_threshold: 0.5
  awareness_update_interval: 1.0
  global_workspace_capacity: 10
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Follow PEP 8 style guidelines
- Add comprehensive docstrings
- Include unit tests for new features
- Update documentation for API changes
- Use type hints throughout the codebase

## 📚 Architecture Documentation

### Cognitive Architecture Flow

```
Input → Attention → Working Memory → Reasoning Engine → Response
  ↓         ↓            ↓              ↓            ↓
Sensory   Focus      Temporary      Logic &      Output
Buffer   Selection   Storage      Inference   Generation
  ↓         ↓            ↓              ↓            ↓
Long-term Memory ← Consolidation ← Metacognition ← Learning
```

### Consciousness Integration

```
Sensory Input → Global Workspace → Consciousness Assessment
     ↓               ↓                      ↓
Attention Schema → Information → Integrated Information (Φ)
     ↓           Integration              ↓
Self-Awareness ←    Theory    →    Consciousness Level
```

### Emotional Processing Pipeline

```
Multi-modal Input → Emotion Recognition → Cultural Adaptation
       ↓                    ↓                    ↓
   Text/Audio/Visual → Primary Emotions → Cultural Context
       ↓                    ↓                    ↓
Therapeutic Assessment → Intervention → Response Generation
```

## 🔬 Research Background

This framework implements cutting-edge research in:

- **Cognitive Science**: ACT-R, SOAR, and CLARION architectures
- **Consciousness Studies**: Global Workspace Theory, IIT, Attention Schema Theory
- **Affective Computing**: Multi-modal emotion recognition, cultural intelligence
- **Computational Psychology**: Cognitive bias modeling, metacognition
- **Therapeutic AI**: Digital mental health interventions

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **ACT-R Research Group** - Cognitive architecture foundations
- **Global Workspace Theory** - Consciousness modeling insights
- **Hugging Face** - Pre-trained models and transformers
- **Qdrant** - Vector database capabilities
- **FastAPI** - Modern web framework

## 📞 Support

For questions, issues, or contributions:

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions)
- **Email**: support@your-domain.com

---

**Built with ❤️ for advancing artificial intelligence and human-computer interaction**
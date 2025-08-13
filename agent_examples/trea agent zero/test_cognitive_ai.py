"""
Comprehensive test suite for the Advanced Cognitive AI Framework
Tests all major components: cognitive reasoning, consciousness, and emotional intelligence
"""

import pytest
import asyncio
import numpy as np
from unittest.mock import Mock, patch, AsyncMock
from datetime import datetime, timedelta
import tempfile
import os

# Import our AI systems
from cognitive_ai_framework import (
    CognitiveAIFramework, 
    CognitiveArchitecture, 
    AttentionMechanism,
    WorkingMemory,
    LongTermMemory,
    ReasoningEngine,
    MetacognitionEngine,
    CognitiveBiasSimulator,
    CognitiveState,
    MemoryItem,
    Goal
)

from advanced_consciousness_model import (
    AdvancedConsciousnessModel,
    ConsciousnessLevel,
    GlobalWorkspaceTheory,
    IntegratedInformationTheory,
    AttentionSchemaTheory
)

from advanced_emotional_ai import (
    AdvancedEmotionalAI,
    CulturalContext,
    TherapeuticApproach,
    EmotionalDisorder,
    CulturalEmotionProcessor,
    TherapeuticInterventionEngine
)


class TestCognitiveAIFramework:
    """Test suite for the core cognitive AI framework"""
    
    @pytest.fixture
    async def cognitive_ai(self):
        """Create a test instance of the cognitive AI framework"""
        with tempfile.TemporaryDirectory() as temp_dir:
            ai = CognitiveAIFramework(
                architecture=CognitiveArchitecture.ACT_R,
                working_memory_capacity=5,
                attention_capacity=3,
                db_path=os.path.join(temp_dir, "test.db")
            )
            await ai.initialize()
            yield ai
            await ai.shutdown()
    
    @pytest.mark.asyncio
    async def test_initialization(self, cognitive_ai):
        """Test that the cognitive AI initializes correctly"""
        assert cognitive_ai.architecture == CognitiveArchitecture.ACT_R
        assert cognitive_ai.working_memory.capacity == 5
        assert cognitive_ai.attention.capacity == 3
        assert cognitive_ai.is_running is True
    
    @pytest.mark.asyncio
    async def test_input_processing(self, cognitive_ai):
        """Test basic input processing and response generation"""
        response = await cognitive_ai.process_input(
            "What is 2 + 2?",
            context={"domain": "mathematics"}
        )
        
        assert "response" in response
        assert "confidence" in response
        assert "reasoning_trace" in response
        assert response["confidence"] > 0.0
        assert response["confidence"] <= 1.0
    
    @pytest.mark.asyncio
    async def test_memory_storage_and_retrieval(self, cognitive_ai):
        """Test memory storage and retrieval functionality"""
        # Store a memory
        memory_item = MemoryItem(
            content="Paris is the capital of France",
            memory_type="semantic",
            importance=0.8,
            timestamp=datetime.now()
        )
        
        await cognitive_ai.long_term_memory.store_memory(memory_item)
        
        # Retrieve the memory
        retrieved = await cognitive_ai.long_term_memory.search_memories(
            "capital of France", limit=1
        )
        
        assert len(retrieved) > 0
        assert "Paris" in retrieved[0].content
    
    @pytest.mark.asyncio
    async def test_reasoning_engine(self, cognitive_ai):
        """Test different reasoning capabilities"""
        reasoning_engine = cognitive_ai.reasoning_engine
        
        # Test deductive reasoning
        premises = ["All humans are mortal", "Socrates is human"]
        conclusion = await reasoning_engine.deductive_reasoning(premises)
        assert "mortal" in conclusion.lower()
        
        # Test inductive reasoning
        observations = [
            "Swan 1 is white",
            "Swan 2 is white", 
            "Swan 3 is white"
        ]
        pattern = await reasoning_engine.inductive_reasoning(observations)
        assert "white" in pattern.lower()
    
    @pytest.mark.asyncio
    async def test_attention_mechanism(self, cognitive_ai):
        """Test attention focusing and management"""
        attention = cognitive_ai.attention
        
        # Test attention focusing
        stimuli = [
            {"content": "urgent email", "salience": 0.9},
            {"content": "background music", "salience": 0.2},
            {"content": "important meeting", "salience": 0.8}
        ]
        
        focused_items = attention.focus_attention(stimuli)
        
        # Should focus on most salient items within capacity
        assert len(focused_items) <= attention.capacity
        assert focused_items[0]["salience"] >= focused_items[-1]["salience"]
    
    @pytest.mark.asyncio
    async def test_working_memory(self, cognitive_ai):
        """Test working memory capacity and decay"""
        working_memory = cognitive_ai.working_memory
        
        # Add items to working memory
        for i in range(7):  # More than capacity
            item = MemoryItem(
                content=f"Item {i}",
                memory_type="working",
                importance=0.5,
                timestamp=datetime.now()
            )
            working_memory.add_item(item)
        
        # Should not exceed capacity
        assert len(working_memory.items) <= working_memory.capacity
        
        # Test decay
        working_memory.update_activations()
        initial_activation = working_memory.items[0].activation if working_memory.items else 0
        
        # Simulate time passage
        await asyncio.sleep(0.1)
        working_memory.update_activations()
        
        if working_memory.items:
            assert working_memory.items[0].activation <= initial_activation
    
    @pytest.mark.asyncio
    async def test_metacognition(self, cognitive_ai):
        """Test metacognitive monitoring and strategy selection"""
        metacognition = cognitive_ai.metacognition
        
        # Test strategy selection
        task = "complex mathematical problem"
        context = {"difficulty": "high", "time_pressure": "low"}
        
        strategy = await metacognition.select_strategy(task, context)
        assert strategy in ["analytical", "intuitive", "systematic", "creative"]
        
        # Test self-reflection
        performance_data = {
            "accuracy": 0.85,
            "response_time": 2.5,
            "confidence": 0.7
        }
        
        reflection = await metacognition.reflect_on_performance(performance_data)
        assert "accuracy" in reflection
        assert "suggestions" in reflection


class TestConsciousnessModel:
    """Test suite for the consciousness simulation model"""
    
    @pytest.fixture
    async def consciousness_model(self):
        """Create a test instance of the consciousness model"""
        model = AdvancedConsciousnessModel()
        await model.initialize()
        yield model
        await model.shutdown()
    
    @pytest.mark.asyncio
    async def test_consciousness_initialization(self, consciousness_model):
        """Test consciousness model initialization"""
        assert consciousness_model.global_workspace is not None
        assert consciousness_model.iit is not None
        assert consciousness_model.attention_schema is not None
    
    @pytest.mark.asyncio
    async def test_global_workspace_theory(self, consciousness_model):
        """Test Global Workspace Theory implementation"""
        gwt = consciousness_model.global_workspace
        
        # Test information broadcasting
        information = {
            "content": "Important decision needed",
            "source": "executive_control",
            "priority": 0.8
        }
        
        result = await gwt.broadcast_information(information)
        assert result["broadcast_success"] is True
        assert result["integration_level"] > 0
    
    @pytest.mark.asyncio
    async def test_integrated_information_theory(self, consciousness_model):
        """Test IIT phi calculation"""
        iit = consciousness_model.iit
        
        # Create a simple network state
        network_state = np.random.rand(5, 5)  # 5x5 connectivity matrix
        
        phi_value = await iit.calculate_phi(network_state)
        assert phi_value >= 0.0
        assert phi_value <= 1.0
    
    @pytest.mark.asyncio
    async def test_attention_schema_theory(self, consciousness_model):
        """Test Attention Schema Theory implementation"""
        ast_model = consciousness_model.attention_schema
        
        # Test self-awareness calculation
        attention_state = {
            "focus_target": "self_reflection",
            "attention_strength": 0.7,
            "meta_attention": 0.6
        }
        
        self_awareness = await ast_model.calculate_self_awareness(attention_state)
        assert 0.0 <= self_awareness <= 1.0
    
    @pytest.mark.asyncio
    async def test_conscious_experience_processing(self, consciousness_model):
        """Test processing of conscious experiences"""
        experience = await consciousness_model.process_conscious_experience(
            sensory_input="Beautiful sunset",
            internal_state={"mood": "peaceful", "energy": 0.6},
            context={"location": "beach", "time": "evening"}
        )
        
        assert "consciousness_level" in experience
        assert "self_awareness_level" in experience
        assert "phi_value" in experience
        assert "global_workspace_activity" in experience
        
        # Consciousness level should be reasonable
        assert 0.0 <= experience["consciousness_level"] <= 1.0


class TestEmotionalAI:
    """Test suite for the advanced emotional AI system"""
    
    @pytest.fixture
    async def emotional_ai(self):
        """Create a test instance of the emotional AI system"""
        ai = AdvancedEmotionalAI()
        await ai.initialize()
        yield ai
        await ai.shutdown()
    
    @pytest.mark.asyncio
    async def test_emotional_ai_initialization(self, emotional_ai):
        """Test emotional AI initialization"""
        assert emotional_ai.cultural_processor is not None
        assert emotional_ai.therapeutic_engine is not None
        assert emotional_ai.group_dynamics is not None
    
    @pytest.mark.asyncio
    async def test_emotion_analysis(self, emotional_ai):
        """Test emotion analysis with cultural context"""
        result = await emotional_ai.analyze_emotion(
            text="I'm feeling overwhelmed with work",
            cultural_context=CulturalContext.WESTERN,
            personality_traits={"neuroticism": 0.7, "extraversion": 0.3}
        )
        
        assert "primary_emotion" in result
        assert "emotional_intensity" in result
        assert "cultural_insights" in result
        assert "therapeutic_recommendations" in result
        
        # Should detect stress/anxiety
        assert result["primary_emotion"] in ["stress", "anxiety", "overwhelm"]
    
    @pytest.mark.asyncio
    async def test_cultural_adaptation(self, emotional_ai):
        """Test cultural emotion processing"""
        processor = emotional_ai.cultural_processor
        
        # Test emotion adaptation across cultures
        base_emotion = {
            "emotion": "pride",
            "intensity": 0.8,
            "expression": "direct"
        }
        
        western_adapted = await processor.adapt_emotion_to_culture(
            base_emotion, CulturalContext.WESTERN
        )
        eastern_adapted = await processor.adapt_emotion_to_culture(
            base_emotion, CulturalContext.EASTERN
        )
        
        # Cultural adaptations should differ
        assert western_adapted != eastern_adapted
        assert "cultural_norms" in western_adapted
        assert "cultural_norms" in eastern_adapted
    
    @pytest.mark.asyncio
    async def test_therapeutic_intervention(self, emotional_ai):
        """Test therapeutic intervention engine"""
        engine = emotional_ai.therapeutic_engine
        
        # Test intervention assessment
        emotional_state = {
            "primary_emotion": "depression",
            "intensity": 0.8,
            "duration": "chronic",
            "triggers": ["work_stress", "isolation"]
        }
        
        assessment = await engine.assess_therapeutic_needs(emotional_state)
        
        assert "intervention_type" in assessment
        assert "urgency_level" in assessment
        assert "recommended_approach" in assessment
        
        # Should recommend appropriate intervention for depression
        assert assessment["intervention_type"] in [
            "cognitive_behavioral", "mindfulness", "supportive"
        ]
    
    @pytest.mark.asyncio
    async def test_group_emotion_dynamics(self, emotional_ai):
        """Test group emotion modeling"""
        group_dynamics = emotional_ai.group_dynamics
        
        # Add members to group
        members = [
            {"id": "user1", "emotion": "happy", "intensity": 0.7},
            {"id": "user2", "emotion": "anxious", "intensity": 0.6},
            {"id": "user3", "emotion": "calm", "intensity": 0.5}
        ]
        
        for member in members:
            await group_dynamics.add_member(
                member["id"], member["emotion"], member["intensity"]
            )
        
        # Test emotional contagion
        contagion_result = await group_dynamics.simulate_emotional_contagion()
        
        assert "group_emotion" in contagion_result
        assert "emotional_diversity" in contagion_result
        assert "contagion_strength" in contagion_result
    
    @pytest.mark.asyncio
    async def test_emotional_memory(self, emotional_ai):
        """Test emotional memory system"""
        # Store emotional memory
        emotional_memory = {
            "content": "Received promotion at work",
            "emotion": "joy",
            "intensity": 0.9,
            "context": {"location": "office", "people": ["boss", "colleagues"]}
        }
        
        await emotional_ai.store_emotional_memory(emotional_memory)
        
        # Retrieve similar emotional memories
        similar_memories = await emotional_ai.retrieve_similar_emotional_memories(
            "work achievement", emotion_filter="joy"
        )
        
        assert len(similar_memories) > 0
        assert similar_memories[0]["emotion"] == "joy"


class TestIntegration:
    """Integration tests for the complete AI system"""
    
    @pytest.fixture
    async def integrated_system(self):
        """Create an integrated AI system with all components"""
        with tempfile.TemporaryDirectory() as temp_dir:
            # Initialize all components
            cognitive_ai = CognitiveAIFramework(
                architecture=CognitiveArchitecture.ACT_R,
                db_path=os.path.join(temp_dir, "cognitive.db")
            )
            consciousness = AdvancedConsciousnessModel()
            emotional_ai = AdvancedEmotionalAI()
            
            await cognitive_ai.initialize()
            await consciousness.initialize()
            await emotional_ai.initialize()
            
            system = {
                "cognitive": cognitive_ai,
                "consciousness": consciousness,
                "emotional": emotional_ai
            }
            
            yield system
            
            # Cleanup
            await cognitive_ai.shutdown()
            await consciousness.shutdown()
            await emotional_ai.shutdown()
    
    @pytest.mark.asyncio
    async def test_integrated_processing(self, integrated_system):
        """Test integrated processing across all AI components"""
        cognitive = integrated_system["cognitive"]
        consciousness = integrated_system["consciousness"]
        emotional = integrated_system["emotional"]
        
        # Process a complex input through all systems
        input_text = "I'm worried about my presentation tomorrow"
        
        # Cognitive processing
        cognitive_response = await cognitive.process_input(input_text)
        
        # Emotional analysis
        emotional_response = await emotional.analyze_emotion(
            text=input_text,
            cultural_context=CulturalContext.WESTERN
        )
        
        # Consciousness processing
        consciousness_response = await consciousness.process_conscious_experience(
            sensory_input=input_text,
            internal_state={"emotion": emotional_response["primary_emotion"]}
        )
        
        # Verify all systems processed the input
        assert cognitive_response["response"] is not None
        assert emotional_response["primary_emotion"] in ["anxiety", "worry", "stress"]
        assert consciousness_response["consciousness_level"] > 0
        
        # Verify emotional and cognitive responses are coherent
        assert "worry" in cognitive_response["response"].lower() or \
               "anxiety" in cognitive_response["response"].lower()
    
    @pytest.mark.asyncio
    async def test_system_metrics(self, integrated_system):
        """Test system-wide metrics collection"""
        cognitive = integrated_system["cognitive"]
        emotional = integrated_system["emotional"]
        
        # Process some inputs to generate metrics
        await cognitive.process_input("Test input 1")
        await emotional.analyze_emotion("I feel great today")
        
        # Get metrics from both systems
        cognitive_metrics = cognitive.get_system_metrics()
        emotional_metrics = await emotional.get_system_metrics()
        
        # Verify metrics are collected
        assert "total_inputs_processed" in cognitive_metrics
        assert "average_response_time" in cognitive_metrics
        assert "emotion_analysis_count" in emotional_metrics
        assert "cultural_adaptation_accuracy" in emotional_metrics


# Performance and stress tests
class TestPerformance:
    """Performance and stress tests for the AI systems"""
    
    @pytest.mark.asyncio
    async def test_concurrent_processing(self):
        """Test concurrent processing capabilities"""
        with tempfile.TemporaryDirectory() as temp_dir:
            cognitive_ai = CognitiveAIFramework(
                db_path=os.path.join(temp_dir, "test.db")
            )
            await cognitive_ai.initialize()
            
            # Process multiple inputs concurrently
            inputs = [f"Test input {i}" for i in range(10)]
            
            start_time = datetime.now()
            tasks = [cognitive_ai.process_input(inp) for inp in inputs]
            responses = await asyncio.gather(*tasks)
            end_time = datetime.now()
            
            # Verify all responses received
            assert len(responses) == 10
            for response in responses:
                assert "response" in response
                assert response["confidence"] > 0
            
            # Performance should be reasonable (less than 30 seconds for 10 inputs)
            processing_time = (end_time - start_time).total_seconds()
            assert processing_time < 30
            
            await cognitive_ai.shutdown()
    
    @pytest.mark.asyncio
    async def test_memory_efficiency(self):
        """Test memory usage efficiency"""
        with tempfile.TemporaryDirectory() as temp_dir:
            cognitive_ai = CognitiveAIFramework(
                working_memory_capacity=100,  # Large capacity
                db_path=os.path.join(temp_dir, "test.db")
            )
            await cognitive_ai.initialize()
            
            # Add many items to memory
            for i in range(1000):
                memory_item = MemoryItem(
                    content=f"Memory item {i}",
                    memory_type="episodic",
                    importance=np.random.random(),
                    timestamp=datetime.now()
                )
                await cognitive_ai.long_term_memory.store_memory(memory_item)
            
            # Memory should handle large datasets efficiently
            search_results = await cognitive_ai.long_term_memory.search_memories(
                "Memory item", limit=10
            )
            
            assert len(search_results) == 10
            
            await cognitive_ai.shutdown()


if __name__ == "__main__":
    # Run the test suite
    pytest.main([__file__, "-v", "--asyncio-mode=auto"])
#!/usr/bin/env python3
"""
ADVANCED EMOTIONAL INTELLIGENCE SYSTEM
Comprehensive Emotion Processing and Social Cognition

This module provides:
- Multi-modal emotion recognition
- Emotion regulation and management
- Empathy and theory of mind
- Social cognition and interaction
- Emotional memory and learning
- Mood tracking and prediction
- Emotional contagion modeling
- Affective computing integration
"""

import asyncio
import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Any, Union, Tuple, Set
from dataclasses import dataclass, field
from enum import Enum
import logging
import time
import json
from datetime import datetime, timedelta
import uuid
import threading
import queue
import random
import math
from collections import deque, defaultdict, Counter
from abc import ABC, abstractmethod
import networkx as nx

# Neural networks and deep learning
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import DataLoader, Dataset
from transformers import pipeline, AutoTokenizer, AutoModel

# Scientific computing
from scipy import stats
from scipy.spatial.distance import cosine, euclidean
from scipy.optimize import minimize
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler

# Audio/Video processing (for multimodal emotion recognition)
import librosa
import cv2

# Monitoring
from prometheus_client import Counter, Histogram, Gauge
import structlog

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = structlog.get_logger()

# Metrics
EMOTION_OPERATIONS = Counter('emotion_operations_total', 'Total emotion operations', ['operation_type'])
EMOTION_INTENSITY = Gauge('emotion_intensity', 'Current emotion intensity', ['emotion'])
EMPATHY_LEVEL = Gauge('empathy_level', 'Current empathy level')
SOCIAL_AWARENESS = Gauge('social_awareness', 'Social awareness level')

class EmotionType(str, Enum):
    # Basic emotions (Ekman)
    HAPPINESS = "happiness"
    SADNESS = "sadness"
    ANGER = "anger"
    FEAR = "fear"
    SURPRISE = "surprise"
    DISGUST = "disgust"
    
    # Complex emotions
    LOVE = "love"
    GUILT = "guilt"
    SHAME = "shame"
    PRIDE = "pride"
    ENVY = "envy"
    JEALOUSY = "jealousy"
    CONTEMPT = "contempt"
    ANXIETY = "anxiety"
    EXCITEMENT = "excitement"
    RELIEF = "relief"
    HOPE = "hope"
    DESPAIR = "despair"
    CURIOSITY = "curiosity"
    BOREDOM = "boredom"
    CONFUSION = "confusion"

class EmotionIntensity(str, Enum):
    VERY_LOW = "very_low"
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    VERY_HIGH = "very_high"

class EmotionRegulationStrategy(str, Enum):
    COGNITIVE_REAPPRAISAL = "cognitive_reappraisal"
    SUPPRESSION = "suppression"
    DISTRACTION = "distraction"
    MINDFULNESS = "mindfulness"
    PROBLEM_SOLVING = "problem_solving"
    SOCIAL_SUPPORT = "social_support"
    PHYSICAL_ACTIVITY = "physical_activity"
    RELAXATION = "relaxation"

class SocialContext(str, Enum):
    FORMAL = "formal"
    INFORMAL = "informal"
    INTIMATE = "intimate"
    PROFESSIONAL = "professional"
    EDUCATIONAL = "educational"
    RECREATIONAL = "recreational"
    CONFLICT = "conflict"
    SUPPORTIVE = "supportive"

@dataclass
class EmotionState:
    """Current emotional state"""
    emotion: EmotionType
    intensity: float  # 0.0 to 1.0
    valence: float    # -1.0 (negative) to 1.0 (positive)
    arousal: float    # 0.0 (calm) to 1.0 (excited)
    confidence: float # 0.0 to 1.0
    timestamp: datetime
    duration: Optional[float] = None
    triggers: List[str] = field(default_factory=list)
    context: Optional[str] = None

@dataclass
class EmotionalMemory:
    """Emotional memory item"""
    memory_id: str
    emotion_state: EmotionState
    associated_content: Any
    importance: float
    access_count: int = 0
    last_accessed: Optional[datetime] = None
    decay_rate: float = 0.1

@dataclass
class SocialAgent:
    """Representation of another social agent"""
    agent_id: str
    name: str
    relationship_type: str
    emotional_history: List[EmotionState] = field(default_factory=list)
    personality_traits: Dict[str, float] = field(default_factory=dict)
    current_mood: Optional[EmotionState] = None
    trust_level: float = 0.5
    empathy_received: float = 0.0

@dataclass
class EmpathyResponse:
    """Empathic response to another's emotion"""
    target_agent: str
    perceived_emotion: EmotionState
    empathic_emotion: EmotionState
    empathy_accuracy: float
    response_type: str  # "emotional_contagion", "sympathy", "compassion"
    action_tendency: Optional[str] = None

class EmotionRecognizer:
    """Multi-modal emotion recognition system"""
    
    def __init__(self):
        self.text_analyzer = None
        self.audio_analyzer = None
        self.visual_analyzer = None
        self.fusion_weights = {'text': 0.4, 'audio': 0.3, 'visual': 0.3}
        
        # Initialize models
        self._initialize_models()
        
    def _initialize_models(self):
        """Initialize emotion recognition models"""
        try:
            # Text emotion analysis
            self.text_analyzer = pipeline(
                "text-classification",
                model="j-hartmann/emotion-english-distilroberta-base",
                device=0 if torch.cuda.is_available() else -1
            )
        except Exception as e:
            logger.warning(f"Could not initialize text emotion model: {e}")
            self.text_analyzer = None
    
    def recognize_emotion_from_text(self, text: str) -> Dict[str, float]:
        """Recognize emotion from text"""
        if not self.text_analyzer:
            return self._fallback_text_emotion(text)
        
        try:
            results = self.text_analyzer(text)
            
            # Convert to our emotion format
            emotion_scores = {}
            for result in results:
                label = result['label'].lower()
                score = result['score']
                
                # Map to our emotion types
                if label in ['joy', 'happiness']:
                    emotion_scores[EmotionType.HAPPINESS.value] = score
                elif label in ['sadness']:
                    emotion_scores[EmotionType.SADNESS.value] = score
                elif label in ['anger']:
                    emotion_scores[EmotionType.ANGER.value] = score
                elif label in ['fear']:
                    emotion_scores[EmotionType.FEAR.value] = score
                elif label in ['surprise']:
                    emotion_scores[EmotionType.SURPRISE.value] = score
                elif label in ['disgust']:
                    emotion_scores[EmotionType.DISGUST.value] = score
                else:
                    emotion_scores[label] = score
            
            return emotion_scores
            
        except Exception as e:
            logger.error(f"Error in text emotion recognition: {e}")
            return self._fallback_text_emotion(text)
    
    def _fallback_text_emotion(self, text: str) -> Dict[str, float]:
        """Fallback text emotion analysis"""
        text_lower = text.lower()
        
        # Simple keyword-based emotion detection
        emotion_keywords = {
            EmotionType.HAPPINESS.value: ['happy', 'joy', 'glad', 'pleased', 'excited', 'wonderful', 'great'],
            EmotionType.SADNESS.value: ['sad', 'depressed', 'down', 'unhappy', 'miserable', 'terrible'],
            EmotionType.ANGER.value: ['angry', 'mad', 'furious', 'annoyed', 'irritated', 'frustrated'],
            EmotionType.FEAR.value: ['afraid', 'scared', 'terrified', 'worried', 'anxious', 'nervous'],
            EmotionType.SURPRISE.value: ['surprised', 'shocked', 'amazed', 'astonished', 'unexpected'],
            EmotionType.DISGUST.value: ['disgusted', 'revolted', 'sick', 'gross', 'awful']
        }
        
        emotion_scores = {}
        for emotion, keywords in emotion_keywords.items():
            score = sum(1 for keyword in keywords if keyword in text_lower)
            emotion_scores[emotion] = min(1.0, score / len(keywords))
        
        return emotion_scores
    
    def recognize_emotion_from_audio(self, audio_data: np.ndarray, sample_rate: int = 22050) -> Dict[str, float]:
        """Recognize emotion from audio features"""
        try:
            # Extract audio features
            features = self._extract_audio_features(audio_data, sample_rate)
            
            # Simple rule-based emotion classification
            emotion_scores = {}
            
            # High energy + high pitch = excitement/happiness
            if features['energy'] > 0.7 and features['pitch_mean'] > 200:
                emotion_scores[EmotionType.HAPPINESS.value] = 0.8
                emotion_scores[EmotionType.EXCITEMENT.value] = 0.7
            
            # Low energy + low pitch = sadness
            elif features['energy'] < 0.3 and features['pitch_mean'] < 150:
                emotion_scores[EmotionType.SADNESS.value] = 0.7
            
            # High energy + pitch variation = anger
            elif features['energy'] > 0.6 and features['pitch_std'] > 50:
                emotion_scores[EmotionType.ANGER.value] = 0.7
            
            # High pitch variation + moderate energy = fear
            elif features['pitch_std'] > 60 and 0.3 < features['energy'] < 0.7:
                emotion_scores[EmotionType.FEAR.value] = 0.6
            
            else:
                # Default neutral state
                emotion_scores[EmotionType.CURIOSITY.value] = 0.5
            
            return emotion_scores
            
        except Exception as e:
            logger.error(f"Error in audio emotion recognition: {e}")
            return {EmotionType.CURIOSITY.value: 0.5}
    
    def _extract_audio_features(self, audio_data: np.ndarray, sample_rate: int) -> Dict[str, float]:
        """Extract audio features for emotion recognition"""
        try:
            # Energy
            energy = np.sum(audio_data ** 2) / len(audio_data)
            
            # Pitch (fundamental frequency)
            pitches, magnitudes = librosa.piptrack(y=audio_data, sr=sample_rate)
            pitch_values = []
            for t in range(pitches.shape[1]):
                index = magnitudes[:, t].argmax()
                pitch = pitches[index, t]
                if pitch > 0:
                    pitch_values.append(pitch)
            
            pitch_mean = np.mean(pitch_values) if pitch_values else 0
            pitch_std = np.std(pitch_values) if pitch_values else 0
            
            # Spectral features
            spectral_centroids = librosa.feature.spectral_centroid(y=audio_data, sr=sample_rate)[0]
            spectral_rolloff = librosa.feature.spectral_rolloff(y=audio_data, sr=sample_rate)[0]
            
            return {
                'energy': min(1.0, energy * 1000),  # Normalize
                'pitch_mean': pitch_mean,
                'pitch_std': pitch_std,
                'spectral_centroid_mean': np.mean(spectral_centroids),
                'spectral_rolloff_mean': np.mean(spectral_rolloff)
            }
            
        except Exception as e:
            logger.error(f"Error extracting audio features: {e}")
            return {'energy': 0.5, 'pitch_mean': 150, 'pitch_std': 30, 'spectral_centroid_mean': 1000, 'spectral_rolloff_mean': 2000}
    
    def recognize_emotion_from_visual(self, image: np.ndarray) -> Dict[str, float]:
        """Recognize emotion from facial expressions"""
        try:
            # Simple facial emotion recognition using OpenCV
            # This is a placeholder - in practice, you'd use a trained model
            
            # Convert to grayscale
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Detect faces
            face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
            faces = face_cascade.detectMultiScale(gray, 1.1, 4)
            
            if len(faces) == 0:
                return {EmotionType.CURIOSITY.value: 0.5}
            
            # For simplicity, return random emotions
            # In practice, this would use a CNN trained on facial expressions
            emotions = [EmotionType.HAPPINESS, EmotionType.SADNESS, EmotionType.ANGER, EmotionType.FEAR, EmotionType.SURPRISE]
            selected_emotion = random.choice(emotions)
            
            return {selected_emotion.value: random.uniform(0.6, 0.9)}
            
        except Exception as e:
            logger.error(f"Error in visual emotion recognition: {e}")
            return {EmotionType.CURIOSITY.value: 0.5}
    
    def fuse_multimodal_emotions(self, text_emotions: Dict[str, float], 
                                audio_emotions: Dict[str, float], 
                                visual_emotions: Dict[str, float]) -> Dict[str, float]:
        """Fuse emotions from multiple modalities"""
        all_emotions = set()
        all_emotions.update(text_emotions.keys())
        all_emotions.update(audio_emotions.keys())
        all_emotions.update(visual_emotions.keys())
        
        fused_emotions = {}
        
        for emotion in all_emotions:
            text_score = text_emotions.get(emotion, 0.0)
            audio_score = audio_emotions.get(emotion, 0.0)
            visual_score = visual_emotions.get(emotion, 0.0)
            
            # Weighted fusion
            fused_score = (
                self.fusion_weights['text'] * text_score +
                self.fusion_weights['audio'] * audio_score +
                self.fusion_weights['visual'] * visual_score
            )
            
            if fused_score > 0.1:  # Only include emotions with significant scores
                fused_emotions[emotion] = fused_score
        
        return fused_emotions

class EmotionRegulator:
    """Emotion regulation and management system"""
    
    def __init__(self):
        self.regulation_strategies = {}
        self.regulation_history = deque(maxlen=100)
        self.effectiveness_scores = defaultdict(list)
        
        # Initialize regulation strategies
        self._initialize_strategies()
    
    def _initialize_strategies(self):
        """Initialize emotion regulation strategies"""
        self.regulation_strategies = {
            EmotionRegulationStrategy.COGNITIVE_REAPPRAISAL: {
                'description': 'Reframe the situation in a more positive light',
                'effectiveness': {'anger': 0.8, 'sadness': 0.7, 'fear': 0.6, 'anxiety': 0.8},
                'effort_required': 0.7,
                'time_to_effect': 2.0  # minutes
            },
            EmotionRegulationStrategy.SUPPRESSION: {
                'description': 'Suppress the emotional expression',
                'effectiveness': {'anger': 0.5, 'sadness': 0.4, 'fear': 0.3},
                'effort_required': 0.8,
                'time_to_effect': 0.5
            },
            EmotionRegulationStrategy.DISTRACTION: {
                'description': 'Focus attention on something else',
                'effectiveness': {'sadness': 0.6, 'anxiety': 0.7, 'anger': 0.5},
                'effort_required': 0.4,
                'time_to_effect': 1.0
            },
            EmotionRegulationStrategy.MINDFULNESS: {
                'description': 'Observe emotions without judgment',
                'effectiveness': {'anxiety': 0.8, 'anger': 0.7, 'sadness': 0.6},
                'effort_required': 0.6,
                'time_to_effect': 3.0
            },
            EmotionRegulationStrategy.PROBLEM_SOLVING: {
                'description': 'Address the root cause of the emotion',
                'effectiveness': {'anger': 0.9, 'fear': 0.8, 'anxiety': 0.7},
                'effort_required': 0.9,
                'time_to_effect': 10.0
            }
        }
    
    def select_regulation_strategy(self, emotion_state: EmotionState, 
                                 available_resources: Dict[str, float]) -> EmotionRegulationStrategy:
        """Select optimal emotion regulation strategy"""
        emotion_name = emotion_state.emotion.value
        intensity = emotion_state.intensity
        
        # Calculate strategy scores
        strategy_scores = {}
        
        for strategy, config in self.regulation_strategies.items():
            # Base effectiveness for this emotion
            base_effectiveness = config['effectiveness'].get(emotion_name, 0.3)
            
            # Adjust for intensity (higher intensity needs more effective strategies)
            intensity_factor = 1.0 + (intensity - 0.5)
            effectiveness = base_effectiveness * intensity_factor
            
            # Consider available resources
            effort_required = config['effort_required']
            available_effort = available_resources.get('cognitive_effort', 0.5)
            
            if effort_required > available_effort:
                effectiveness *= 0.5  # Penalize strategies requiring too much effort
            
            # Consider time constraints
            time_required = config['time_to_effect']
            available_time = available_resources.get('time_available', 5.0)
            
            if time_required > available_time:
                effectiveness *= 0.7  # Penalize strategies taking too long
            
            # Consider past effectiveness
            past_scores = self.effectiveness_scores.get(strategy.value, [])
            if past_scores:
                past_effectiveness = np.mean(past_scores)
                effectiveness = 0.7 * effectiveness + 0.3 * past_effectiveness
            
            strategy_scores[strategy] = effectiveness
        
        # Select best strategy
        best_strategy = max(strategy_scores.keys(), key=lambda s: strategy_scores[s])
        
        return best_strategy
    
    def apply_regulation_strategy(self, emotion_state: EmotionState, 
                                strategy: EmotionRegulationStrategy) -> EmotionState:
        """Apply emotion regulation strategy"""
        start_time = time.time()
        
        config = self.regulation_strategies[strategy]
        base_effectiveness = config['effectiveness'].get(emotion_state.emotion.value, 0.3)
        
        # Calculate regulation effect
        intensity_reduction = base_effectiveness * emotion_state.intensity
        new_intensity = max(0.0, emotion_state.intensity - intensity_reduction)
        
        # Adjust valence if applicable
        new_valence = emotion_state.valence
        if strategy == EmotionRegulationStrategy.COGNITIVE_REAPPRAISAL:
            # Reappraisal can make negative emotions less negative
            if new_valence < 0:
                new_valence = min(0.0, new_valence + 0.3)
        
        # Create regulated emotion state
        regulated_state = EmotionState(
            emotion=emotion_state.emotion,
            intensity=new_intensity,
            valence=new_valence,
            arousal=max(0.0, emotion_state.arousal - 0.2),  # Generally reduces arousal
            confidence=emotion_state.confidence * 0.9,  # Slight reduction in confidence
            timestamp=datetime.now(),
            triggers=emotion_state.triggers + [f"regulated_by_{strategy.value}"],
            context=emotion_state.context
        )
        
        # Record regulation attempt
        regulation_record = {
            'original_state': emotion_state,
            'strategy': strategy,
            'regulated_state': regulated_state,
            'effectiveness': (emotion_state.intensity - new_intensity) / emotion_state.intensity,
            'timestamp': datetime.now(),
            'processing_time': time.time() - start_time
        }
        
        self.regulation_history.append(regulation_record)
        
        # Update effectiveness scores
        effectiveness = regulation_record['effectiveness']
        self.effectiveness_scores[strategy.value].append(effectiveness)
        
        EMOTION_OPERATIONS.labels(operation_type='regulation').inc()
        
        logger.debug(f"Applied {strategy.value} to {emotion_state.emotion.value}, "
                    f"intensity: {emotion_state.intensity:.2f} -> {new_intensity:.2f}")
        
        return regulated_state
    
    def get_regulation_recommendations(self, emotion_state: EmotionState) -> List[Dict[str, Any]]:
        """Get regulation strategy recommendations"""
        recommendations = []
        
        for strategy, config in self.regulation_strategies.items():
            effectiveness = config['effectiveness'].get(emotion_state.emotion.value, 0.3)
            
            # Adjust for intensity
            adjusted_effectiveness = effectiveness * (1.0 + emotion_state.intensity - 0.5)
            
            recommendation = {
                'strategy': strategy.value,
                'description': config['description'],
                'predicted_effectiveness': min(1.0, adjusted_effectiveness),
                'effort_required': config['effort_required'],
                'time_to_effect': config['time_to_effect'],
                'past_success_rate': np.mean(self.effectiveness_scores.get(strategy.value, [0.5]))
            }
            
            recommendations.append(recommendation)
        
        # Sort by predicted effectiveness
        recommendations.sort(key=lambda x: x['predicted_effectiveness'], reverse=True)
        
        return recommendations

class EmpathyEngine:
    """Empathy and theory of mind system"""
    
    def __init__(self):
        self.social_agents = {}
        self.empathy_history = deque(maxlen=100)
        self.empathy_accuracy_scores = deque(maxlen=50)
        self.emotional_contagion_susceptibility = 0.6
        
    def register_social_agent(self, agent_id: str, name: str, relationship_type: str) -> SocialAgent:
        """Register a new social agent"""
        agent = SocialAgent(
            agent_id=agent_id,
            name=name,
            relationship_type=relationship_type,
            personality_traits=self._infer_personality_traits(relationship_type)
        )
        
        self.social_agents[agent_id] = agent
        
        return agent
    
    def _infer_personality_traits(self, relationship_type: str) -> Dict[str, float]:
        """Infer personality traits based on relationship type"""
        # Big Five personality traits
        base_traits = {
            'openness': 0.5,
            'conscientiousness': 0.5,
            'extraversion': 0.5,
            'agreeableness': 0.5,
            'neuroticism': 0.5
        }
        
        # Adjust based on relationship type
        if relationship_type == 'friend':
            base_traits['agreeableness'] += 0.2
            base_traits['extraversion'] += 0.1
        elif relationship_type == 'colleague':
            base_traits['conscientiousness'] += 0.2
        elif relationship_type == 'family':
            base_traits['agreeableness'] += 0.3
        elif relationship_type == 'stranger':
            base_traits['neuroticism'] += 0.1
        
        # Normalize to [0, 1]
        for trait in base_traits:
            base_traits[trait] = max(0.0, min(1.0, base_traits[trait]))
        
        return base_traits
    
    def perceive_other_emotion(self, agent_id: str, behavioral_cues: Dict[str, Any]) -> EmotionState:
        """Perceive another agent's emotional state"""
        if agent_id not in self.social_agents:
            # Create unknown agent
            self.register_social_agent(agent_id, f"Unknown_{agent_id[:8]}", "stranger")
        
        agent = self.social_agents[agent_id]
        
        # Extract emotion cues
        facial_expression = behavioral_cues.get('facial_expression', 'neutral')
        vocal_tone = behavioral_cues.get('vocal_tone', 'neutral')
        body_language = behavioral_cues.get('body_language', 'neutral')
        verbal_content = behavioral_cues.get('verbal_content', '')
        
        # Emotion inference based on cues
        perceived_emotion = self._infer_emotion_from_cues(
            facial_expression, vocal_tone, body_language, verbal_content
        )
        
        # Adjust based on agent's personality and history
        perceived_emotion = self._adjust_for_agent_context(perceived_emotion, agent)
        
        # Update agent's emotional history
        agent.emotional_history.append(perceived_emotion)
        agent.current_mood = perceived_emotion
        
        return perceived_emotion
    
    def _infer_emotion_from_cues(self, facial: str, vocal: str, body: str, verbal: str) -> EmotionState:
        """Infer emotion from behavioral cues"""
        # Simple rule-based emotion inference
        emotion_scores = defaultdict(float)
        
        # Facial expression cues
        facial_emotions = {
            'smile': EmotionType.HAPPINESS,
            'frown': EmotionType.SADNESS,
            'scowl': EmotionType.ANGER,
            'wide_eyes': EmotionType.SURPRISE,
            'raised_eyebrows': EmotionType.SURPRISE,
            'tears': EmotionType.SADNESS
        }
        
        if facial in facial_emotions:
            emotion_scores[facial_emotions[facial]] += 0.4
        
        # Vocal tone cues
        vocal_emotions = {
            'high_pitch': EmotionType.EXCITEMENT,
            'low_pitch': EmotionType.SADNESS,
            'fast_speech': EmotionType.ANXIETY,
            'slow_speech': EmotionType.SADNESS,
            'loud': EmotionType.ANGER,
            'quiet': EmotionType.FEAR
        }
        
        if vocal in vocal_emotions:
            emotion_scores[vocal_emotions[vocal]] += 0.3
        
        # Body language cues
        body_emotions = {
            'tense': EmotionType.ANXIETY,
            'relaxed': EmotionType.HAPPINESS,
            'closed_posture': EmotionType.SADNESS,
            'open_posture': EmotionType.HAPPINESS,
            'fidgeting': EmotionType.ANXIETY
        }
        
        if body in body_emotions:
            emotion_scores[body_emotions[body]] += 0.2
        
        # Verbal content analysis (simplified)
        if verbal:
            # Use simple keyword matching
            if any(word in verbal.lower() for word in ['happy', 'great', 'wonderful']):
                emotion_scores[EmotionType.HAPPINESS] += 0.3
            elif any(word in verbal.lower() for word in ['sad', 'terrible', 'awful']):
                emotion_scores[EmotionType.SADNESS] += 0.3
            elif any(word in verbal.lower() for word in ['angry', 'mad', 'furious']):
                emotion_scores[EmotionType.ANGER] += 0.3
        
        # Select dominant emotion
        if emotion_scores:
            dominant_emotion = max(emotion_scores.keys(), key=lambda e: emotion_scores[e])
            intensity = min(1.0, emotion_scores[dominant_emotion])
        else:
            dominant_emotion = EmotionType.CURIOSITY
            intensity = 0.5
        
        # Calculate valence and arousal
        valence = self._get_emotion_valence(dominant_emotion)
        arousal = self._get_emotion_arousal(dominant_emotion)
        
        return EmotionState(
            emotion=dominant_emotion,
            intensity=intensity,
            valence=valence,
            arousal=arousal,
            confidence=0.7,  # Moderate confidence in perception
            timestamp=datetime.now(),
            context="perceived_from_other"
        )
    
    def _adjust_for_agent_context(self, perceived_emotion: EmotionState, agent: SocialAgent) -> EmotionState:
        """Adjust perceived emotion based on agent context"""
        # Consider agent's personality
        personality = agent.personality_traits
        
        # High neuroticism agents might appear more emotional
        if personality.get('neuroticism', 0.5) > 0.7:
            perceived_emotion.intensity *= 1.2
        
        # Low extraversion agents might suppress emotional expression
        if personality.get('extraversion', 0.5) < 0.3:
            perceived_emotion.intensity *= 0.8
        
        # Consider relationship and trust
        if agent.trust_level > 0.7:
            perceived_emotion.confidence *= 1.1  # More confident in reading trusted agents
        
        # Consider emotional history
        if agent.emotional_history:
            recent_emotions = agent.emotional_history[-3:]
            avg_intensity = np.mean([e.intensity for e in recent_emotions])
            
            # Smooth intensity based on recent history
            perceived_emotion.intensity = 0.7 * perceived_emotion.intensity + 0.3 * avg_intensity
        
        # Normalize values
        perceived_emotion.intensity = max(0.0, min(1.0, perceived_emotion.intensity))
        perceived_emotion.confidence = max(0.0, min(1.0, perceived_emotion.confidence))
        
        return perceived_emotion
    
    def generate_empathic_response(self, agent_id: str, perceived_emotion: EmotionState) -> EmpathyResponse:
        """Generate empathic response to another's emotion"""
        if agent_id not in self.social_agents:
            return None
        
        agent = self.social_agents[agent_id]
        
        # Determine type of empathic response
        response_type = self._determine_empathy_type(perceived_emotion, agent)
        
        # Generate empathic emotion
        empathic_emotion = self._generate_empathic_emotion(perceived_emotion, response_type, agent)
        
        # Calculate empathy accuracy (simplified)
        empathy_accuracy = self._calculate_empathy_accuracy(perceived_emotion, empathic_emotion)
        
        # Determine action tendency
        action_tendency = self._determine_action_tendency(empathic_emotion, agent)
        
        empathy_response = EmpathyResponse(
            target_agent=agent_id,
            perceived_emotion=perceived_emotion,
            empathic_emotion=empathic_emotion,
            empathy_accuracy=empathy_accuracy,
            response_type=response_type,
            action_tendency=action_tendency
        )
        
        # Update agent's empathy received
        agent.empathy_received += empathy_accuracy
        
        # Record empathy history
        self.empathy_history.append(empathy_response)
        self.empathy_accuracy_scores.append(empathy_accuracy)
        
        EMPATHY_LEVEL.set(np.mean(list(self.empathy_accuracy_scores)))
        EMOTION_OPERATIONS.labels(operation_type='empathy').inc()
        
        return empathy_response
    
    def _determine_empathy_type(self, perceived_emotion: EmotionState, agent: SocialAgent) -> str:
        """Determine type of empathic response"""
        relationship = agent.relationship_type
        emotion_valence = perceived_emotion.valence
        emotion_intensity = perceived_emotion.intensity
        
        # Emotional contagion for close relationships and high intensity
        if relationship in ['friend', 'family'] and emotion_intensity > 0.7:
            return "emotional_contagion"
        
        # Sympathy for negative emotions
        elif emotion_valence < -0.3:
            return "sympathy"
        
        # Compassion for suffering
        elif perceived_emotion.emotion in [EmotionType.SADNESS, EmotionType.FEAR, EmotionType.ANXIETY]:
            return "compassion"
        
        else:
            return "cognitive_empathy"
    
    def _generate_empathic_emotion(self, perceived_emotion: EmotionState, 
                                 response_type: str, agent: SocialAgent) -> EmotionState:
        """Generate empathic emotional response"""
        if response_type == "emotional_contagion":
            # Mirror the emotion with some attenuation
            empathic_emotion = EmotionState(
                emotion=perceived_emotion.emotion,
                intensity=perceived_emotion.intensity * self.emotional_contagion_susceptibility,
                valence=perceived_emotion.valence,
                arousal=perceived_emotion.arousal * 0.8,
                confidence=0.8,
                timestamp=datetime.now(),
                context="empathic_contagion"
            )
        
        elif response_type == "sympathy":
            # Feel concern/sadness for the other
            empathic_emotion = EmotionState(
                emotion=EmotionType.SADNESS,
                intensity=perceived_emotion.intensity * 0.6,
                valence=-0.4,
                arousal=0.4,
                confidence=0.7,
                timestamp=datetime.now(),
                context="empathic_sympathy"
            )
        
        elif response_type == "compassion":
            # Feel motivated to help
            empathic_emotion = EmotionState(
                emotion=EmotionType.HOPE,  # Compassionate hope
                intensity=0.6,
                valence=0.3,
                arousal=0.6,
                confidence=0.8,
                timestamp=datetime.now(),
                context="empathic_compassion"
            )
        
        else:  # cognitive_empathy
            # Understand without strong emotional response
            empathic_emotion = EmotionState(
                emotion=EmotionType.CURIOSITY,
                intensity=0.4,
                valence=0.1,
                arousal=0.3,
                confidence=0.6,
                timestamp=datetime.now(),
                context="cognitive_empathy"
            )
        
        return empathic_emotion
    
    def _calculate_empathy_accuracy(self, perceived: EmotionState, empathic: EmotionState) -> float:
        """Calculate empathy accuracy score"""
        # Compare emotion types
        emotion_match = 1.0 if perceived.emotion == empathic.emotion else 0.5
        
        # Compare intensities
        intensity_diff = abs(perceived.intensity - empathic.intensity)
        intensity_match = 1.0 - intensity_diff
        
        # Compare valences
        valence_diff = abs(perceived.valence - empathic.valence)
        valence_match = 1.0 - (valence_diff / 2.0)  # Normalize by max difference (2.0)
        
        # Weighted accuracy
        accuracy = 0.4 * emotion_match + 0.3 * intensity_match + 0.3 * valence_match
        
        return max(0.0, min(1.0, accuracy))
    
    def _determine_action_tendency(self, empathic_emotion: EmotionState, agent: SocialAgent) -> str:
        """Determine action tendency based on empathic emotion"""
        emotion = empathic_emotion.emotion
        intensity = empathic_emotion.intensity
        relationship = agent.relationship_type
        
        if emotion in [EmotionType.SADNESS, EmotionType.FEAR] and intensity > 0.5:
            if relationship in ['friend', 'family']:
                return "offer_support"
            else:
                return "express_concern"
        
        elif emotion == EmotionType.HAPPINESS and intensity > 0.6:
            return "share_joy"
        
        elif emotion == EmotionType.ANGER and intensity > 0.5:
            return "validate_feelings"
        
        elif emotion == EmotionType.HOPE:
            return "offer_help"
        
        else:
            return "acknowledge"
    
    def _get_emotion_valence(self, emotion: EmotionType) -> float:
        """Get valence for emotion type"""
        valence_map = {
            EmotionType.HAPPINESS: 0.8,
            EmotionType.SADNESS: -0.7,
            EmotionType.ANGER: -0.6,
            EmotionType.FEAR: -0.8,
            EmotionType.SURPRISE: 0.2,
            EmotionType.DISGUST: -0.7,
            EmotionType.LOVE: 0.9,
            EmotionType.GUILT: -0.5,
            EmotionType.SHAME: -0.6,
            EmotionType.PRIDE: 0.7,
            EmotionType.ENVY: -0.4,
            EmotionType.JEALOUSY: -0.5,
            EmotionType.CONTEMPT: -0.3,
            EmotionType.ANXIETY: -0.6,
            EmotionType.EXCITEMENT: 0.8,
            EmotionType.RELIEF: 0.5,
            EmotionType.HOPE: 0.6,
            EmotionType.DESPAIR: -0.9,
            EmotionType.CURIOSITY: 0.3,
            EmotionType.BOREDOM: -0.2,
            EmotionType.CONFUSION: -0.1
        }
        
        return valence_map.get(emotion, 0.0)
    
    def _get_emotion_arousal(self, emotion: EmotionType) -> float:
        """Get arousal for emotion type"""
        arousal_map = {
            EmotionType.HAPPINESS: 0.6,
            EmotionType.SADNESS: 0.3,
            EmotionType.ANGER: 0.8,
            EmotionType.FEAR: 0.9,
            EmotionType.SURPRISE: 0.8,
            EmotionType.DISGUST: 0.5,
            EmotionType.LOVE: 0.7,
            EmotionType.GUILT: 0.4,
            EmotionType.SHAME: 0.5,
            EmotionType.PRIDE: 0.6,
            EmotionType.ENVY: 0.6,
            EmotionType.JEALOUSY: 0.7,
            EmotionType.CONTEMPT: 0.4,
            EmotionType.ANXIETY: 0.8,
            EmotionType.EXCITEMENT: 0.9,
            EmotionType.RELIEF: 0.3,
            EmotionType.HOPE: 0.5,
            EmotionType.DESPAIR: 0.4,
            EmotionType.CURIOSITY: 0.6,
            EmotionType.BOREDOM: 0.2,
            EmotionType.CONFUSION: 0.5
        }
        
        return arousal_map.get(emotion, 0.5)

class EmotionalIntelligenceSystem:
    """Complete emotional intelligence system"""
    
    def __init__(self):
        self.emotion_recognizer = EmotionRecognizer()
        self.emotion_regulator = EmotionRegulator()
        self.empathy_engine = EmpathyEngine()
        
        self.current_emotion_state = None
        self.emotional_memory = {}
        self.mood_history = deque(maxlen=100)
        self.social_context = SocialContext.INFORMAL
        
        # Background processes
        self.background_tasks = []
        
    async def start(self):
        """Start emotional intelligence system"""
        logger.info("Starting emotional intelligence system")
        
        # Start background processes
        self.background_tasks = [
            asyncio.create_task(self._mood_tracking_loop()),
            asyncio.create_task(self._emotional_memory_consolidation_loop()),
            asyncio.create_task(self._social_awareness_update_loop())
        ]
        
        logger.info("Emotional intelligence system started")
    
    async def stop(self):
        """Stop emotional intelligence system"""
        logger.info("Stopping emotional intelligence system")
        
        # Cancel background tasks
        for task in self.background_tasks:
            task.cancel()
        
        await asyncio.gather(*self.background_tasks, return_exceptions=True)
        
        logger.info("Emotional intelligence system stopped")
    
    async def process_emotional_input(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process emotional input and generate response"""
        start_time = time.time()
        
        # Recognize emotions from input
        recognized_emotions = {}
        
        if 'text' in input_data:
            text_emotions = self.emotion_recognizer.recognize_emotion_from_text(input_data['text'])
            recognized_emotions.update(text_emotions)
        
        if 'audio' in input_data:
            audio_emotions = self.emotion_recognizer.recognize_emotion_from_audio(
                input_data['audio'], input_data.get('sample_rate', 22050)
            )
            recognized_emotions.update(audio_emotions)
        
        if 'image' in input_data:
            visual_emotions = self.emotion_recognizer.recognize_emotion_from_visual(input_data['image'])
            recognized_emotions.update(visual_emotions)
        
        # Determine dominant emotion
        if recognized_emotions:
            dominant_emotion_name = max(recognized_emotions.keys(), key=lambda e: recognized_emotions[e])
            dominant_emotion = EmotionType(dominant_emotion_name)
            intensity = recognized_emotions[dominant_emotion_name]
        else:
            dominant_emotion = EmotionType.CURIOSITY
            intensity = 0.5
        
        # Create emotion state
        emotion_state = EmotionState(
            emotion=dominant_emotion,
            intensity=intensity,
            valence=self.empathy_engine._get_emotion_valence(dominant_emotion),
            arousal=self.empathy_engine._get_emotion_arousal(dominant_emotion),
            confidence=0.8,
            timestamp=datetime.now(),
            triggers=input_data.get('triggers', []),
            context=input_data.get('context', 'user_input')
        )
        
        # Update current emotion state
        self.current_emotion_state = emotion_state
        
        # Store in emotional memory
        memory_id = str(uuid.uuid4())
        emotional_memory = EmotionalMemory(
            memory_id=memory_id,
            emotion_state=emotion_state,
            associated_content=input_data,
            importance=intensity
        )
        self.emotional_memory[memory_id] = emotional_memory
        
        # Check if emotion regulation is needed
        regulation_result = None
        if intensity > 0.7 and emotion_state.valence < -0.5:
            # High intensity negative emotion - consider regulation
            available_resources = {
                'cognitive_effort': 0.8,
                'time_available': 5.0
            }
            
            strategy = self.emotion_regulator.select_regulation_strategy(emotion_state, available_resources)
            regulated_state = self.emotion_regulator.apply_regulation_strategy(emotion_state, strategy)
            
            regulation_result = {
                'strategy_used': strategy.value,
                'original_intensity': intensity,
                'regulated_intensity': regulated_state.intensity,
                'effectiveness': (intensity - regulated_state.intensity) / intensity
            }
            
            # Update current state to regulated state
            self.current_emotion_state = regulated_state
        
        # Generate empathic responses if other agents are involved
        empathy_responses = []
        if 'other_agents' in input_data:
            for agent_data in input_data['other_agents']:
                agent_id = agent_data['agent_id']
                behavioral_cues = agent_data.get('behavioral_cues', {})
                
                perceived_emotion = self.empathy_engine.perceive_other_emotion(agent_id, behavioral_cues)
                empathy_response = self.empathy_engine.generate_empathic_response(agent_id, perceived_emotion)
                
                empathy_responses.append({
                    'agent_id': agent_id,
                    'perceived_emotion': {
                        'emotion': perceived_emotion.emotion.value,
                        'intensity': perceived_emotion.intensity,
                        'valence': perceived_emotion.valence
                    },
                    'empathic_response': {
                        'emotion': empathy_response.empathic_emotion.emotion.value,
                        'intensity': empathy_response.empathic_emotion.intensity,
                        'response_type': empathy_response.response_type,
                        'action_tendency': empathy_response.action_tendency
                    },
                    'empathy_accuracy': empathy_response.empathy_accuracy
                })
        
        # Update mood history
        self.mood_history.append(emotion_state)
        
        # Update metrics
        EMOTION_INTENSITY.labels(emotion=dominant_emotion.value).set(intensity)
        EMOTION_OPERATIONS.labels(operation_type='processing').inc()
        
        processing_time = time.time() - start_time
        
        result = {
            'recognized_emotions': recognized_emotions,
            'dominant_emotion': {
                'emotion': dominant_emotion.value,
                'intensity': intensity,
                'valence': emotion_state.valence,
                'arousal': emotion_state.arousal,
                'confidence': emotion_state.confidence
            },
            'regulation_result': regulation_result,
            'empathy_responses': empathy_responses,
            'emotional_memory_id': memory_id,
            'processing_time': processing_time,
            'timestamp': datetime.now()
        }
        
        return result
    
    async def _mood_tracking_loop(self):
        """Background mood tracking"""
        while True:
            try:
                if len(self.mood_history) > 5:
                    # Calculate mood trends
                    recent_moods = list(self.mood_history)[-10:]
                    
                    # Average valence and arousal
                    avg_valence = np.mean([mood.valence for mood in recent_moods])
                    avg_arousal = np.mean([mood.arousal for mood in recent_moods])
                    
                    # Detect mood patterns
                    valence_trend = np.polyfit(range(len(recent_moods)), 
                                             [mood.valence for mood in recent_moods], 1)[0]
                    
                    # Log mood insights
                    if abs(valence_trend) > 0.1:
                        trend_direction = "improving" if valence_trend > 0 else "declining"
                        logger.info(f"Mood trend detected: {trend_direction} (slope: {valence_trend:.3f})")
                
                await asyncio.sleep(30.0)  # Check every 30 seconds
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in mood tracking: {e}")
                await asyncio.sleep(30.0)
    
    async def _emotional_memory_consolidation_loop(self):
        """Background emotional memory consolidation"""
        while True:
            try:
                # Consolidate emotional memories
                current_time = datetime.now()
                
                for memory_id, memory in list(self.emotional_memory.items()):
                    # Apply decay
                    time_since_creation = (current_time - memory.emotion_state.timestamp).total_seconds() / 3600  # hours
                    decay_factor = math.exp(-memory.decay_rate * time_since_creation)
                    
                    memory.importance *= decay_factor
                    
                    # Remove very low importance memories
                    if memory.importance < 0.1:
                        del self.emotional_memory[memory_id]
                
                await asyncio.sleep(300.0)  # Consolidate every 5 minutes
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in emotional memory consolidation: {e}")
                await asyncio.sleep(300.0)
    
    async def _social_awareness_update_loop(self):
        """Background social awareness updates"""
        while True:
            try:
                # Update social awareness metrics
                if self.empathy_engine.social_agents:
                    # Calculate average empathy accuracy
                    if self.empathy_engine.empathy_accuracy_scores:
                        avg_empathy = np.mean(list(self.empathy_engine.empathy_accuracy_scores))
                        EMPATHY_LEVEL.set(avg_empathy)
                    
                    # Calculate social awareness based on agent interactions
                    total_agents = len(self.empathy_engine.social_agents)
                    active_agents = sum(1 for agent in self.empathy_engine.social_agents.values() 
                                      if agent.current_mood is not None)
                    
                    social_awareness = active_agents / total_agents if total_agents > 0 else 0
                    SOCIAL_AWARENESS.set(social_awareness)
                
                await asyncio.sleep(60.0)  # Update every minute
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in social awareness update: {e}")
                await asyncio.sleep(60.0)
    
    def get_emotional_intelligence_report(self) -> Dict[str, Any]:
        """Get comprehensive emotional intelligence report"""
        # Current emotional state
        current_state = None
        if self.current_emotion_state:
            current_state = {
                'emotion': self.current_emotion_state.emotion.value,
                'intensity': self.current_emotion_state.intensity,
                'valence': self.current_emotion_state.valence,
                'arousal': self.current_emotion_state.arousal,
                'confidence': self.current_emotion_state.confidence
            }
        
        # Mood analysis
        mood_analysis = {}
        if len(self.mood_history) > 5:
            recent_moods = list(self.mood_history)[-20:]
            
            mood_analysis = {
                'average_valence': np.mean([mood.valence for mood in recent_moods]),
                'average_arousal': np.mean([mood.arousal for mood in recent_moods]),
                'mood_stability': 1.0 - np.std([mood.valence for mood in recent_moods]),
                'dominant_emotions': Counter([mood.emotion.value for mood in recent_moods]).most_common(3)
            }
        
        # Regulation effectiveness
        regulation_stats = {}
        if self.emotion_regulator.regulation_history:
            recent_regulations = list(self.emotion_regulator.regulation_history)[-10:]
            
            regulation_stats = {
                'total_regulations': len(recent_regulations),
                'average_effectiveness': np.mean([r['effectiveness'] for r in recent_regulations]),
                'most_used_strategy': Counter([r['strategy'].value for r in recent_regulations]).most_common(1)[0][0],
                'strategy_effectiveness': {
                    strategy: np.mean(scores) for strategy, scores in 
                    self.emotion_regulator.effectiveness_scores.items()
                }
            }
        
        # Empathy analysis
        empathy_stats = {}
        if self.empathy_engine.empathy_history:
            recent_empathy = list(self.empathy_engine.empathy_history)[-10:]
            
            empathy_stats = {
                'total_empathic_responses': len(recent_empathy),
                'average_empathy_accuracy': np.mean([e.empathy_accuracy for e in recent_empathy]),
                'empathy_types': Counter([e.response_type for e in recent_empathy]).most_common(),
                'social_agents_count': len(self.empathy_engine.social_agents)
            }
        
        # Emotional memory
        memory_stats = {
            'total_memories': len(self.emotional_memory),
            'high_importance_memories': len([m for m in self.emotional_memory.values() if m.importance > 0.7]),
            'memory_emotion_distribution': Counter([m.emotion_state.emotion.value for m in self.emotional_memory.values()]).most_common(5)
        }
        
        return {
            'current_emotional_state': current_state,
            'mood_analysis': mood_analysis,
            'emotion_regulation': regulation_stats,
            'empathy_analysis': empathy_stats,
            'emotional_memory': memory_stats,
            'social_context': self.social_context.value,
            'timestamp': datetime.now()
        }

# Example usage and testing
async def main():
    """Example usage of emotional intelligence system"""
    ei_system = EmotionalIntelligenceSystem()
    
    await ei_system.start()
    
    try:
        # Test emotional input processing
        test_inputs = [
            {
                'text': "I'm feeling really excited about this new project!",
                'context': 'work_discussion',
                'triggers': ['new_project_announcement']
            },
            {
                'text': "I'm worried about the upcoming presentation",
                'context': 'work_stress',
                'triggers': ['presentation_anxiety'],
                'other_agents': [
                    {
                        'agent_id': 'colleague_1',
                        'behavioral_cues': {
                            'facial_expression': 'frown',
                            'vocal_tone': 'quiet',
                            'verbal_content': 'I understand how you feel'
                        }
                    }
                ]
            },
            {
                'text': "That's absolutely wonderful news!",
                'context': 'celebration',
                'triggers': ['good_news_received']
            }
        ]
        
        for i, input_data in enumerate(test_inputs):
            print(f"\n--- Processing Input {i+1} ---")
            result = await ei_system.process_emotional_input(input_data)
            
            print(f"Input: {input_data['text']}")
            print(f"Dominant emotion: {result['dominant_emotion']['emotion']} "
                  f"(intensity: {result['dominant_emotion']['intensity']:.2f})")
            
            if result['regulation_result']:
                print(f"Emotion regulation applied: {result['regulation_result']['strategy_used']} "
                      f"(effectiveness: {result['regulation_result']['effectiveness']:.2f})")
            
            if result['empathy_responses']:
                for emp_resp in result['empathy_responses']:
                    print(f"Empathy for {emp_resp['agent_id']}: "
                          f"{emp_resp['empathic_response']['emotion']} -> "
                          f"{emp_resp['empathic_response']['action_tendency']}")
            
            await asyncio.sleep(2)
        
        # Get final report
        report = ei_system.get_emotional_intelligence_report()
        print("\n--- Emotional Intelligence Report ---")
        print(json.dumps(report, indent=2, default=str))
        
    finally:
        await ei_system.stop()

if __name__ == "__main__":
    asyncio.run(main())
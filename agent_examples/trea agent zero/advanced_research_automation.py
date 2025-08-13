#!/usr/bin/env python3
"""
ADVANCED RESEARCH AUTOMATION SYSTEM
Comprehensive Academic & Deep Web Research Platform

This module provides:
- Automated academic paper discovery and analysis
- Deep web and dark web research capabilities
- Multi-source data aggregation and synthesis
- AI-powered research insights and summaries
- Citation network analysis
- Real-time research monitoring
- Collaborative research workflows
"""

import asyncio
import json
import logging
import time
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union, Tuple
from dataclasses import dataclass, field
from enum import Enum
import hashlib
import pickle
from pathlib import Path
import os
import sys
import re
from urllib.parse import urljoin, urlparse
import xml.etree.ElementTree as ET

# Core libraries
import numpy as np
import pandas as pd
import requests
import aiohttp
import asyncpg
from bs4 import BeautifulSoup
import feedparser
from scholarly import scholarly
import arxiv
import pubmed_parser
from crossref.restful import Works
import semanticscholar as sch

# Web scraping and automation
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.proxy import Proxy, ProxyType
import undetected_chromedriver as uc
from fake_useragent import UserAgent

# Tor and dark web
import stem
from stem import Signal
from stem.control import Controller
import socks
import socket

# NLP and AI
import spacy
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize, sent_tokenize
from transformers import AutoTokenizer, AutoModel, pipeline
from sentence_transformers import SentenceTransformer
import openai
import anthropic

# Data processing
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans, DBSCAN
from sklearn.decomposition import PCA, LatentDirichletAllocation
from sklearn.metrics.pairwise import cosine_similarity
import networkx as nx
from pyvis.network import Network

# Visualization
import matplotlib.pyplot as plt
import seaborn as sns
import plotly.graph_objects as go
import plotly.express as px
from wordcloud import WordCloud

# Database and storage
import sqlite3
from sqlalchemy import create_engine, MetaData, Table, Column, String, DateTime, JSON, Float, Text
import redis
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct

# Monitoring
from prometheus_client import Counter, Histogram, Gauge
import structlog

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = structlog.get_logger()

# Metrics
RESEARCH_QUERIES = Counter('research_queries_total', 'Total research queries', ['source', 'type'])
PAPERS_DISCOVERED = Counter('papers_discovered_total', 'Total papers discovered', ['source'])
RESEARCH_LATENCY = Histogram('research_latency_seconds', 'Research query latency')
ACTIVE_CRAWLERS = Gauge('active_crawlers_count', 'Number of active crawlers')

class ResearchSource(str, Enum):
    ARXIV = "arxiv"
    PUBMED = "pubmed"
    SEMANTIC_SCHOLAR = "semantic_scholar"
    GOOGLE_SCHOLAR = "google_scholar"
    CROSSREF = "crossref"
    DEEP_WEB = "deep_web"
    DARK_WEB = "dark_web"
    ACADEMIC_DATABASES = "academic_databases"
    NEWS_SOURCES = "news_sources"
    SOCIAL_MEDIA = "social_media"

class ResearchType(str, Enum):
    LITERATURE_REVIEW = "literature_review"
    TREND_ANALYSIS = "trend_analysis"
    CITATION_ANALYSIS = "citation_analysis"
    COMPETITIVE_INTELLIGENCE = "competitive_intelligence"
    MARKET_RESEARCH = "market_research"
    OSINT = "osint"
    ACADEMIC_MONITORING = "academic_monitoring"

@dataclass
class ResearchQuery:
    """Research query configuration"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    query: str
    sources: List[ResearchSource] = field(default_factory=list)
    research_type: ResearchType = ResearchType.LITERATURE_REVIEW
    date_range: Optional[Tuple[datetime, datetime]] = None
    max_results: int = 100
    include_citations: bool = True
    include_abstracts: bool = True
    include_full_text: bool = False
    language: str = "en"
    fields: List[str] = field(default_factory=list)
    exclude_terms: List[str] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.utcnow)

@dataclass
class ResearchPaper:
    """Research paper data structure"""
    id: str
    title: str
    authors: List[str]
    abstract: str
    publication_date: Optional[datetime]
    journal: Optional[str]
    doi: Optional[str]
    arxiv_id: Optional[str]
    pubmed_id: Optional[str]
    semantic_scholar_id: Optional[str]
    citations: List[str] = field(default_factory=list)
    references: List[str] = field(default_factory=list)
    keywords: List[str] = field(default_factory=list)
    full_text: Optional[str] = None
    pdf_url: Optional[str] = None
    source: ResearchSource = ResearchSource.ARXIV
    relevance_score: float = 0.0
    embedding: Optional[List[float]] = None

@dataclass
class ResearchResult:
    """Research result with analysis"""
    query_id: str
    papers: List[ResearchPaper]
    total_found: int
    summary: str
    key_insights: List[str]
    trending_topics: List[str]
    citation_network: Dict[str, Any]
    research_gaps: List[str]
    recommendations: List[str]
    execution_time: float
    sources_used: List[ResearchSource]
    created_at: datetime = field(default_factory=datetime.utcnow)

class TorManager:
    """Tor network manager for dark web research"""
    
    def __init__(self, tor_port: int = 9050, control_port: int = 9051):
        self.tor_port = tor_port
        self.control_port = control_port
        self.session = None
        self.controller = None
    
    async def initialize(self):
        """Initialize Tor connection"""
        try:
            # Configure SOCKS proxy
            socks.set_default_proxy(socks.SOCKS5, "127.0.0.1", self.tor_port)
            socket.socket = socks.socksocket
            
            # Create session with Tor proxy
            self.session = aiohttp.ClientSession(
                connector=aiohttp.TCPConnector(
                    resolver=aiohttp.AsyncResolver(),
                    family=socket.AF_INET
                ),
                timeout=aiohttp.ClientTimeout(total=30)
            )
            
            # Connect to Tor controller
            self.controller = Controller.from_port(port=self.control_port)
            self.controller.authenticate()
            
            logger.info("Tor connection initialized")
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize Tor: {e}")
            return False
    
    async def new_identity(self):
        """Request new Tor identity"""
        try:
            if self.controller:
                self.controller.signal(Signal.NEWNYM)
                await asyncio.sleep(5)  # Wait for new circuit
                logger.info("New Tor identity requested")
        except Exception as e:
            logger.error(f"Failed to get new identity: {e}")
    
    async def get_onion_page(self, url: str) -> Optional[str]:
        """Fetch content from onion site"""
        try:
            if not self.session:
                await self.initialize()
            
            headers = {
                'User-Agent': UserAgent().random
            }
            
            async with self.session.get(url, headers=headers) as response:
                if response.status == 200:
                    return await response.text()
                else:
                    logger.warning(f"Failed to fetch {url}: {response.status}")
                    return None
                    
        except Exception as e:
            logger.error(f"Error fetching onion page {url}: {e}")
            return None
    
    async def close(self):
        """Close Tor connections"""
        if self.session:
            await self.session.close()
        if self.controller:
            self.controller.close()

class AcademicSearchEngine:
    """Multi-source academic search engine"""
    
    def __init__(self):
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        self.nlp = spacy.load("en_core_web_sm")
        self.works = Works()
    
    async def search_arxiv(self, query: str, max_results: int = 50) -> List[ResearchPaper]:
        """Search arXiv papers"""
        papers = []
        
        try:
            search = arxiv.Search(
                query=query,
                max_results=max_results,
                sort_by=arxiv.SortCriterion.Relevance
            )
            
            for result in search.results():
                paper = ResearchPaper(
                    id=result.entry_id,
                    title=result.title,
                    authors=[str(author) for author in result.authors],
                    abstract=result.summary,
                    publication_date=result.published,
                    arxiv_id=result.entry_id.split('/')[-1],
                    pdf_url=result.pdf_url,
                    source=ResearchSource.ARXIV
                )
                papers.append(paper)
                
            PAPERS_DISCOVERED.labels(source="arxiv").inc(len(papers))
            logger.info(f"Found {len(papers)} papers from arXiv")
            
        except Exception as e:
            logger.error(f"arXiv search failed: {e}")
        
        return papers
    
    async def search_pubmed(self, query: str, max_results: int = 50) -> List[ResearchPaper]:
        """Search PubMed papers"""
        papers = []
        
        try:
            # Use PubMed E-utilities API
            base_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/"
            
            # Search for PMIDs
            search_url = f"{base_url}esearch.fcgi"
            search_params = {
                'db': 'pubmed',
                'term': query,
                'retmax': max_results,
                'retmode': 'json'
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(search_url, params=search_params) as response:
                    search_data = await response.json()
                    pmids = search_data.get('esearchresult', {}).get('idlist', [])
                
                if pmids:
                    # Fetch paper details
                    fetch_url = f"{base_url}efetch.fcgi"
                    fetch_params = {
                        'db': 'pubmed',
                        'id': ','.join(pmids),
                        'retmode': 'xml'
                    }
                    
                    async with session.get(fetch_url, params=fetch_params) as response:
                        xml_data = await response.text()
                        papers = self._parse_pubmed_xml(xml_data)
            
            PAPERS_DISCOVERED.labels(source="pubmed").inc(len(papers))
            logger.info(f"Found {len(papers)} papers from PubMed")
            
        except Exception as e:
            logger.error(f"PubMed search failed: {e}")
        
        return papers
    
    def _parse_pubmed_xml(self, xml_data: str) -> List[ResearchPaper]:
        """Parse PubMed XML response"""
        papers = []
        
        try:
            root = ET.fromstring(xml_data)
            
            for article in root.findall('.//PubmedArticle'):
                title_elem = article.find('.//ArticleTitle')
                abstract_elem = article.find('.//AbstractText')
                authors_elems = article.findall('.//Author')
                pmid_elem = article.find('.//PMID')
                
                title = title_elem.text if title_elem is not None else ""
                abstract = abstract_elem.text if abstract_elem is not None else ""
                authors = []
                
                for author in authors_elems:
                    lastname = author.find('LastName')
                    forename = author.find('ForeName')
                    if lastname is not None and forename is not None:
                        authors.append(f"{forename.text} {lastname.text}")
                
                pmid = pmid_elem.text if pmid_elem is not None else ""
                
                paper = ResearchPaper(
                    id=f"pubmed_{pmid}",
                    title=title,
                    authors=authors,
                    abstract=abstract,
                    pubmed_id=pmid,
                    source=ResearchSource.PUBMED
                )
                papers.append(paper)
                
        except Exception as e:
            logger.error(f"Failed to parse PubMed XML: {e}")
        
        return papers
    
    async def search_semantic_scholar(self, query: str, max_results: int = 50) -> List[ResearchPaper]:
        """Search Semantic Scholar"""
        papers = []
        
        try:
            # Use Semantic Scholar API
            url = "https://api.semanticscholar.org/graph/v1/paper/search"
            params = {
                'query': query,
                'limit': max_results,
                'fields': 'paperId,title,abstract,authors,year,journal,citationCount,referenceCount,url'
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        for paper_data in data.get('data', []):
                            authors = [author.get('name', '') for author in paper_data.get('authors', [])]
                            
                            paper = ResearchPaper(
                                id=f"s2_{paper_data.get('paperId', '')}",
                                title=paper_data.get('title', ''),
                                authors=authors,
                                abstract=paper_data.get('abstract', ''),
                                journal=paper_data.get('journal', {}).get('name') if paper_data.get('journal') else None,
                                semantic_scholar_id=paper_data.get('paperId'),
                                source=ResearchSource.SEMANTIC_SCHOLAR
                            )
                            papers.append(paper)
            
            PAPERS_DISCOVERED.labels(source="semantic_scholar").inc(len(papers))
            logger.info(f"Found {len(papers)} papers from Semantic Scholar")
            
        except Exception as e:
            logger.error(f"Semantic Scholar search failed: {e}")
        
        return papers
    
    async def search_google_scholar(self, query: str, max_results: int = 50) -> List[ResearchPaper]:
        """Search Google Scholar (with rate limiting)"""
        papers = []
        
        try:
            search_query = scholarly.search_pubs(query)
            
            count = 0
            for pub in search_query:
                if count >= max_results:
                    break
                
                paper = ResearchPaper(
                    id=f"gs_{hashlib.md5(pub.get('title', '').encode()).hexdigest()}",
                    title=pub.get('title', ''),
                    authors=pub.get('author', []),
                    abstract=pub.get('abstract', ''),
                    publication_date=self._parse_year(pub.get('year')),
                    journal=pub.get('journal', ''),
                    source=ResearchSource.GOOGLE_SCHOLAR
                )
                papers.append(paper)
                count += 1
                
                # Rate limiting
                await asyncio.sleep(1)
            
            PAPERS_DISCOVERED.labels(source="google_scholar").inc(len(papers))
            logger.info(f"Found {len(papers)} papers from Google Scholar")
            
        except Exception as e:
            logger.error(f"Google Scholar search failed: {e}")
        
        return papers
    
    def _parse_year(self, year_str: str) -> Optional[datetime]:
        """Parse year string to datetime"""
        try:
            if year_str and year_str.isdigit():
                return datetime(int(year_str), 1, 1)
        except:
            pass
        return None

class DeepWebCrawler:
    """Deep web and dark web crawler"""
    
    def __init__(self):
        self.tor_manager = TorManager()
        self.user_agent = UserAgent()
        self.session = None
    
    async def initialize(self):
        """Initialize crawler"""
        await self.tor_manager.initialize()
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=30),
            headers={'User-Agent': self.user_agent.random}
        )
    
    async def crawl_onion_sites(self, onion_urls: List[str]) -> Dict[str, str]:
        """Crawl onion sites for research data"""
        results = {}
        
        for url in onion_urls:
            try:
                content = await self.tor_manager.get_onion_page(url)
                if content:
                    results[url] = content
                    logger.info(f"Successfully crawled {url}")
                
                # Rotate identity periodically
                if len(results) % 5 == 0:
                    await self.tor_manager.new_identity()
                
            except Exception as e:
                logger.error(f"Failed to crawl {url}: {e}")
        
        return results
    
    async def search_academic_databases(self, query: str, databases: List[str]) -> Dict[str, List[Dict]]:
        """Search academic databases"""
        results = {}
        
        # Database configurations
        db_configs = {
            'ieee': {
                'url': 'https://ieeexplore.ieee.org/rest/search',
                'params': {'queryText': query, 'highlight': 'true', 'returnFacets': ['ALL']}
            },
            'acm': {
                'url': 'https://dl.acm.org/action/doSearch',
                'params': {'AllField': query}
            },
            'springer': {
                'url': 'https://api.springernature.com/meta/v2/json',
                'params': {'q': query, 'api_key': 'your_api_key'}
            }
        }
        
        for db_name in databases:
            if db_name in db_configs:
                try:
                    config = db_configs[db_name]
                    async with self.session.get(config['url'], params=config['params']) as response:
                        if response.status == 200:
                            data = await response.json()
                            results[db_name] = self._parse_database_results(db_name, data)
                            
                except Exception as e:
                    logger.error(f"Failed to search {db_name}: {e}")
        
        return results
    
    def _parse_database_results(self, db_name: str, data: Dict) -> List[Dict]:
        """Parse database-specific results"""
        # Implement database-specific parsing logic
        return []
    
    async def close(self):
        """Close crawler connections"""
        if self.session:
            await self.session.close()
        await self.tor_manager.close()

class ResearchAnalyzer:
    """AI-powered research analysis"""
    
    def __init__(self):
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        self.nlp = spacy.load("en_core_web_sm")
        self.summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
        self.classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")
    
    def analyze_papers(self, papers: List[ResearchPaper]) -> Dict[str, Any]:
        """Comprehensive analysis of research papers"""
        analysis = {
            'total_papers': len(papers),
            'temporal_distribution': self._analyze_temporal_distribution(papers),
            'author_network': self._build_author_network(papers),
            'topic_clusters': self._cluster_papers_by_topic(papers),
            'citation_analysis': self._analyze_citations(papers),
            'keyword_trends': self._extract_trending_keywords(papers),
            'research_gaps': self._identify_research_gaps(papers),
            'quality_metrics': self._assess_paper_quality(papers)
        }
        
        return analysis
    
    def _analyze_temporal_distribution(self, papers: List[ResearchPaper]) -> Dict[str, Any]:
        """Analyze temporal distribution of papers"""
        years = []
        for paper in papers:
            if paper.publication_date:
                years.append(paper.publication_date.year)
        
        if not years:
            return {}
        
        year_counts = pd.Series(years).value_counts().sort_index()
        
        return {
            'year_distribution': year_counts.to_dict(),
            'trend': 'increasing' if year_counts.iloc[-1] > year_counts.iloc[0] else 'decreasing',
            'peak_year': year_counts.idxmax(),
            'total_years': len(year_counts)
        }
    
    def _build_author_network(self, papers: List[ResearchPaper]) -> Dict[str, Any]:
        """Build author collaboration network"""
        G = nx.Graph()
        
        for paper in papers:
            authors = paper.authors
            # Add edges between all pairs of authors in the same paper
            for i, author1 in enumerate(authors):
                for author2 in authors[i+1:]:
                    if G.has_edge(author1, author2):
                        G[author1][author2]['weight'] += 1
                    else:
                        G.add_edge(author1, author2, weight=1)
        
        # Calculate network metrics
        metrics = {
            'total_authors': G.number_of_nodes(),
            'total_collaborations': G.number_of_edges(),
            'density': nx.density(G),
            'average_clustering': nx.average_clustering(G) if G.number_of_nodes() > 0 else 0
        }
        
        # Find most connected authors
        if G.number_of_nodes() > 0:
            centrality = nx.degree_centrality(G)
            top_authors = sorted(centrality.items(), key=lambda x: x[1], reverse=True)[:10]
            metrics['top_authors'] = top_authors
        
        return metrics
    
    def _cluster_papers_by_topic(self, papers: List[ResearchPaper]) -> Dict[str, Any]:
        """Cluster papers by topic using embeddings"""
        if not papers:
            return {}
        
        # Extract text for embedding
        texts = []
        for paper in papers:
            text = f"{paper.title} {paper.abstract}"
            texts.append(text)
        
        # Generate embeddings
        embeddings = self.embedding_model.encode(texts)
        
        # Perform clustering
        n_clusters = min(5, len(papers) // 2) if len(papers) > 2 else 1
        kmeans = KMeans(n_clusters=n_clusters, random_state=42)
        cluster_labels = kmeans.fit_predict(embeddings)
        
        # Analyze clusters
        clusters = {}
        for i in range(n_clusters):
            cluster_papers = [papers[j] for j, label in enumerate(cluster_labels) if label == i]
            cluster_texts = [texts[j] for j, label in enumerate(cluster_labels) if label == i]
            
            # Extract representative keywords
            vectorizer = TfidfVectorizer(max_features=10, stop_words='english')
            tfidf_matrix = vectorizer.fit_transform(cluster_texts)
            feature_names = vectorizer.get_feature_names_out()
            mean_scores = np.mean(tfidf_matrix.toarray(), axis=0)
            top_keywords = [feature_names[idx] for idx in np.argsort(mean_scores)[-5:]]
            
            clusters[f"cluster_{i}"] = {
                'size': len(cluster_papers),
                'keywords': top_keywords,
                'papers': [paper.title for paper in cluster_papers[:3]]  # Top 3 papers
            }
        
        return clusters
    
    def _analyze_citations(self, papers: List[ResearchPaper]) -> Dict[str, Any]:
        """Analyze citation patterns"""
        citation_counts = [len(paper.citations) for paper in papers if paper.citations]
        
        if not citation_counts:
            return {}
        
        return {
            'average_citations': np.mean(citation_counts),
            'median_citations': np.median(citation_counts),
            'max_citations': np.max(citation_counts),
            'citation_distribution': np.histogram(citation_counts, bins=10)[0].tolist()
        }
    
    def _extract_trending_keywords(self, papers: List[ResearchPaper]) -> List[str]:
        """Extract trending keywords from papers"""
        all_text = " ".join([f"{paper.title} {paper.abstract}" for paper in papers])
        
        # Process with spaCy
        doc = self.nlp(all_text)
        
        # Extract entities and noun phrases
        keywords = []
        for ent in doc.ents:
            if ent.label_ in ['ORG', 'PRODUCT', 'TECHNOLOGY']:
                keywords.append(ent.text.lower())
        
        for chunk in doc.noun_chunks:
            if len(chunk.text.split()) <= 3:  # Limit to 3-word phrases
                keywords.append(chunk.text.lower())
        
        # Count and return top keywords
        keyword_counts = pd.Series(keywords).value_counts()
        return keyword_counts.head(20).index.tolist()
    
    def _identify_research_gaps(self, papers: List[ResearchPaper]) -> List[str]:
        """Identify potential research gaps"""
        # This is a simplified implementation
        # In practice, this would use more sophisticated NLP techniques
        
        common_phrases = [
            "future work",
            "further research",
            "limitations",
            "not addressed",
            "remains unclear",
            "needs investigation"
        ]
        
        gaps = []
        for paper in papers:
            text = f"{paper.title} {paper.abstract}".lower()
            for phrase in common_phrases:
                if phrase in text:
                    # Extract sentence containing the phrase
                    sentences = sent_tokenize(paper.abstract)
                    for sentence in sentences:
                        if phrase in sentence.lower():
                            gaps.append(sentence.strip())
                            break
        
        return gaps[:10]  # Return top 10 gaps
    
    def _assess_paper_quality(self, papers: List[ResearchPaper]) -> Dict[str, Any]:
        """Assess overall quality of papers"""
        quality_metrics = {
            'has_abstract': sum(1 for p in papers if p.abstract),
            'has_doi': sum(1 for p in papers if p.doi),
            'has_citations': sum(1 for p in papers if p.citations),
            'average_title_length': np.mean([len(p.title.split()) for p in papers]),
            'average_abstract_length': np.mean([len(p.abstract.split()) for p in papers if p.abstract])
        }
        
        return quality_metrics

class AdvancedResearchAutomation:
    """Main research automation system"""
    
    def __init__(self):
        self.academic_search = AcademicSearchEngine()
        self.deep_web_crawler = DeepWebCrawler()
        self.analyzer = ResearchAnalyzer()
        self.vector_store = None
        self.cache = None
    
    async def initialize(self):
        """Initialize the research system"""
        # Initialize vector store
        qdrant_client = QdrantClient(host="localhost", port=6333)
        self.vector_store = qdrant_client
        
        # Initialize cache
        self.cache = redis.Redis(host="localhost", port=6379, db=0)
        
        # Initialize crawlers
        await self.deep_web_crawler.initialize()
        
        logger.info("Advanced Research Automation System initialized")
    
    @RESEARCH_LATENCY.time()
    async def conduct_research(self, query: ResearchQuery) -> ResearchResult:
        """Conduct comprehensive research"""
        start_time = time.time()
        all_papers = []
        sources_used = []
        
        # Search academic sources
        if ResearchSource.ARXIV in query.sources:
            papers = await self.academic_search.search_arxiv(query.query, query.max_results)
            all_papers.extend(papers)
            sources_used.append(ResearchSource.ARXIV)
            RESEARCH_QUERIES.labels(source="arxiv", type=query.research_type.value).inc()
        
        if ResearchSource.PUBMED in query.sources:
            papers = await self.academic_search.search_pubmed(query.query, query.max_results)
            all_papers.extend(papers)
            sources_used.append(ResearchSource.PUBMED)
            RESEARCH_QUERIES.labels(source="pubmed", type=query.research_type.value).inc()
        
        if ResearchSource.SEMANTIC_SCHOLAR in query.sources:
            papers = await self.academic_search.search_semantic_scholar(query.query, query.max_results)
            all_papers.extend(papers)
            sources_used.append(ResearchSource.SEMANTIC_SCHOLAR)
            RESEARCH_QUERIES.labels(source="semantic_scholar", type=query.research_type.value).inc()
        
        # Remove duplicates
        unique_papers = self._deduplicate_papers(all_papers)
        
        # Generate embeddings for papers
        for paper in unique_papers:
            text = f"{paper.title} {paper.abstract}"
            paper.embedding = self.analyzer.embedding_model.encode(text).tolist()
        
        # Analyze papers
        analysis = self.analyzer.analyze_papers(unique_papers)
        
        # Generate insights
        insights = await self._generate_insights(unique_papers, analysis)
        
        # Create result
        execution_time = time.time() - start_time
        result = ResearchResult(
            query_id=query.id,
            papers=unique_papers,
            total_found=len(unique_papers),
            summary=insights['summary'],
            key_insights=insights['key_insights'],
            trending_topics=analysis.get('keyword_trends', []),
            citation_network=analysis.get('author_network', {}),
            research_gaps=analysis.get('research_gaps', []),
            recommendations=insights['recommendations'],
            execution_time=execution_time,
            sources_used=sources_used
        )
        
        # Store in vector database
        await self._store_research_result(result)
        
        return result
    
    def _deduplicate_papers(self, papers: List[ResearchPaper]) -> List[ResearchPaper]:
        """Remove duplicate papers based on title similarity"""
        if not papers:
            return []
        
        unique_papers = []
        seen_titles = set()
        
        for paper in papers:
            # Normalize title
            normalized_title = re.sub(r'[^\w\s]', '', paper.title.lower())
            
            # Check for exact matches
            if normalized_title not in seen_titles:
                seen_titles.add(normalized_title)
                unique_papers.append(paper)
        
        return unique_papers
    
    async def _generate_insights(self, papers: List[ResearchPaper], analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Generate AI-powered insights"""
        # Prepare text for analysis
        abstracts = [paper.abstract for paper in papers if paper.abstract]
        combined_text = " ".join(abstracts[:10])  # Limit to first 10 abstracts
        
        # Generate summary
        if len(combined_text) > 1000:
            summary = self.analyzer.summarizer(combined_text[:1000], max_length=150, min_length=50)[0]['summary_text']
        else:
            summary = "Insufficient text for summarization."
        
        # Extract key insights
        key_insights = []
        if analysis.get('topic_clusters'):
            for cluster_name, cluster_data in analysis['topic_clusters'].items():
                insight = f"Research cluster focused on: {', '.join(cluster_data['keywords'])}"
                key_insights.append(insight)
        
        # Generate recommendations
        recommendations = [
            "Consider exploring interdisciplinary approaches",
            "Look for recent developments in related fields",
            "Investigate potential collaboration opportunities",
            "Review methodology trends in the field"
        ]
        
        return {
            'summary': summary,
            'key_insights': key_insights,
            'recommendations': recommendations
        }
    
    async def _store_research_result(self, result: ResearchResult):
        """Store research result in vector database"""
        try:
            # Create collection if it doesn't exist
            collection_name = "research_results"
            try:
                self.vector_store.get_collection(collection_name)
            except:
                self.vector_store.create_collection(
                    collection_name=collection_name,
                    vectors_config=VectorParams(size=384, distance=Distance.COSINE)
                )
            
            # Generate embedding for the result
            result_text = f"{result.summary} {' '.join(result.key_insights)}"
            embedding = self.analyzer.embedding_model.encode(result_text).tolist()
            
            # Store in vector database
            point = PointStruct(
                id=result.query_id,
                vector=embedding,
                payload={
                    "query_id": result.query_id,
                    "summary": result.summary,
                    "total_papers": result.total_found,
                    "sources_used": [s.value for s in result.sources_used],
                    "created_at": result.created_at.isoformat()
                }
            )
            
            self.vector_store.upsert(collection_name=collection_name, points=[point])
            
        except Exception as e:
            logger.error(f"Failed to store research result: {e}")
    
    async def close(self):
        """Close all connections"""
        await self.deep_web_crawler.close()

# Example usage
async def main():
    """Example usage of the research automation system"""
    research_system = AdvancedResearchAutomation()
    await research_system.initialize()
    
    # Create research query
    query = ResearchQuery(
        query="machine learning in healthcare",
        sources=[ResearchSource.ARXIV, ResearchSource.PUBMED, ResearchSource.SEMANTIC_SCHOLAR],
        research_type=ResearchType.LITERATURE_REVIEW,
        max_results=50
    )
    
    # Conduct research
    result = await research_system.conduct_research(query)
    
    # Print results
    print(f"Found {result.total_found} papers")
    print(f"Summary: {result.summary}")
    print(f"Key insights: {result.key_insights}")
    print(f"Trending topics: {result.trending_topics}")
    
    await research_system.close()

if __name__ == "__main__":
    asyncio.run(main())
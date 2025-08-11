// Enhanced Research Assistant Template
const researchAssistant = {
    name: "Research Assistant",
    description: "AI-powered research with real-time web search",
    features: [
        "Live web search via Brave API",
        "Fact verification and source checking",
        "Research report generation",
        "Educational content curation"
    ],
    searchCapabilities: true,
    voiceEnabled: true,
    childFriendly: true,

    // Template configuration
    template: {
        layout: "search-results",
        colorScheme: "academic-blue",
        components: [
            "search-bar",
            "results-display",
            "fact-checker",
            "report-generator"
        ]
    },

    // API integrations
    apis: {
        braveSearch: true,
        factCheck: true,
        wikipedia: true,
        educationalResources: true
    },

    // Education settings
    education: {
        gradeLevel: "6-12",
        subjects: ["science", "history", "geography", "literature"],
        safeSearch: true,
        parentalControls: true
    }
};

// Export for use in TalkToApp
if (typeof module !== 'undefined' && module.exports) {
    module.exports = researchAssistant;
}

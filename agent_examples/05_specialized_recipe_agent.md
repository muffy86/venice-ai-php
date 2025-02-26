# Specialized Example: Recipe Assistant Agent

This example demonstrates a highly specialized agent focused on a specific domain - recipes and cooking. It shows how agents can be tailored to provide expert assistance in a particular field.

## What This Agent Does

- Suggests recipes based on available ingredients
- Provides step-by-step cooking instructions
- Offers ingredient substitutions
- Adjusts recipe serving sizes
- Answers cooking-related questions
- Stores user food preferences and dietary restrictions

## The Code

```php
<?php
/**
 * Recipe Assistant Agent
 * 
 * A specialized agent focused on recipes, cooking, and food-related assistance.
 * This example demonstrates how to create a domain-specific agent with expertise
 * in a particular area.
 */

// Load the Venice AI SDK
require_once __DIR__ . '/VeniceAI.php';

/**
 * RecipeAgent Class
 */
class RecipeAgent {
    // Venice AI client
    private $venice;
    
    // User profile
    private $userProfile = [
        'preferences' => [],
        'allergies' => [],
        'dietaryRestrictions' => [],
        'favoriteRecipes' => []
    ];
    
    // Profile file path
    private $profileFile;
    
    // Recipe database (simplified for this example)
    private $recipeDatabase = [];
    
    // Recipe database file
    private $recipeDatabaseFile;
    
    // Conversation history
    private $conversationHistory = [];
    
    /**
     * Constructor
     * 
     * @param string $apiKey Venice AI API key
     * @param string $dataDir Directory to store data files
     */
    public function __construct($apiKey, $dataDir = './data') {
        // Initialize the Venice AI client
        $this->venice = new VeniceAI($apiKey);
        
        // Ensure data directory exists
        if (!is_dir($dataDir)) {
            mkdir($dataDir, 0755, true);
        }
        
        // Set file paths
        $this->profileFile = $dataDir . '/user_profile.json';
        $this->recipeDatabaseFile = $dataDir . '/recipe_database.json';
        
        // Load user profile and recipe database
        $this->loadUserProfile();
        $this->loadRecipeDatabase();
        
        // If recipe database is empty, initialize with sample recipes
        if (empty($this->recipeDatabase)) {
            $this->initializeSampleRecipes();
            $this->saveRecipeDatabase();
        }
    }
    
    /**
     * Process a user message and generate a response
     * 
     * @param string $message User message
     * @return string Agent response
     */
    public function processMessage($message) {
        // Add user message to history
        $this->addToHistory('user', $message);
        
        // Check for direct commands
        $commandResponse = $this->handleDirectCommands($message);
        if ($commandResponse !== null) {
            $this->addToHistory('assistant', $commandResponse);
            return $commandResponse;
        }
        
        // Analyze the message to determine intent
        $intent = $this->analyzeIntent($message);
        
        // Handle the intent
        $response = $this->handleIntent($intent, $message);
        
        // Add response to history
        $this->addToHistory('assistant', $response);
        
        return $response;
    }
    
    /**
     * Handle direct commands without using AI
     * 
     * @param string $message User message
     * @return string|null Response or null if not a direct command
     */
    private function handleDirectCommands($message) {
        $message = strtolower(trim($message));
        
        // Help command
        if ($message === 'help') {
            return "I'm your recipe assistant! Here's what I can help you with:\n\n" .
                   "🍳 Recipe suggestions: 'What can I make with chicken and potatoes?'\n" .
                   "📋 Recipe instructions: 'How do I make chocolate chip cookies?'\n" .
                   "🥕 Ingredient substitutions: 'What can I use instead of eggs?'\n" .
                   "👨‍👩‍👧‍👦 Adjust servings: 'Adjust this recipe for 6 people'\n" .
                   "❓ Cooking questions: 'How long should I cook pasta?'\n" .
                   "🍽️ Dietary preferences: 'I'm vegetarian' or 'I'm allergic to nuts'\n" .
                   "⭐ Favorites: 'Save this recipe as favorite' or 'Show my favorite recipes'";
        }
        
        // Show user profile
        if ($message === 'show my profile' || $message === 'what do you know about me') {
            return $this->formatUserProfile();
        }
        
        // Show favorite recipes
        if ($message === 'show my favorite recipes' || $message === 'what are my favorite recipes') {
            return $this->listFavoriteRecipes();
        }
        
        return null; // Not a direct command
    }
    
    /**
     * Analyze the intent of the user message
     * 
     * @param string $message User message
     * @return array Intent data
     */
    private function analyzeIntent($message) {
        // Prepare system message
        $systemPrompt = "You are a recipe assistant. Analyze the user's message to determine their culinary intent. " .
                        "Respond with a JSON object with the following structure:\n" .
                        "{\n" .
                        "  \"intent\": \"find_recipe|get_instructions|ingredient_substitution|adjust_servings|cooking_question|update_preferences|other\",\n" .
                        "  \"ingredients\": [list of ingredients mentioned] or null,\n" .
                        "  \"recipe_name\": specific recipe name if mentioned or null,\n" .
                        "  \"servings\": number of servings if mentioned or null,\n" .
                        "  \"dietary_info\": any dietary preferences/restrictions mentioned or null,\n" .
                        "  \"confidence\": 0-1 indicating confidence\n" .
                        "}\n" .
                        "Provide only the JSON without any additional text.";
        
        $messages = [
            ['role' => 'system', 'content' => $systemPrompt],
            ['role' => 'user', 'content' => $message]
        ];
        
        try {
            // Get response from Venice AI
            $response = $this->venice->createChatCompletion($messages);
            
            // Extract and parse JSON
            $content = $response['choices'][0]['message']['content'];
            $intentData = json_decode($content, true);
            
            // Validate and return
            if (is_array($intentData) && isset($intentData['intent'])) {
                return $intentData;
            }
        } catch (Exception $e) {
            // If API request fails or parsing fails, use fallback
        }
        
        // Fallback intent analysis
        return [
            'intent' => 'other',
            'ingredients' => null,
            'recipe_name' => null,
            'servings' => null,
            'dietary_info' => null,
            'confidence' => 0.5
        ];
    }
    
    /**
     * Handle the intent
     * 
     * @param array $intent Intent data
     * @param string $originalMessage Original user message
     * @return string Response
     */
    private function handleIntent($intent, $originalMessage) {
        switch ($intent['intent']) {
            case 'find_recipe':
                return $this->findRecipes($intent);
                
            case 'get_instructions':
                return $this->getRecipeInstructions($intent);
                
            case 'ingredient_substitution':
                return $this->suggestSubstitutions($intent, $originalMessage);
                
            case 'adjust_servings':
                return $this->adjustServings($intent);
                
            case 'cooking_question':
                return $this->answerCookingQuestion($originalMessage);
                
            case 'update_preferences':
                return $this->updatePreferences($intent);
                
            default:
                // For other intents, generate a conversational response
                return $this->generateConversationalResponse($originalMessage);
        }
    }
    
    /**
     * Find recipes based on ingredients and constraints
     * 
     * @param array $intent Intent data
     * @return string Response with recipe suggestions
     */
    private function findRecipes($intent) {
        $ingredients = $intent['ingredients'] ?? [];
        $dietaryInfo = $intent['dietary_info'] ?? null;
        
        if (empty($ingredients)) {
            return "I'd be happy to suggest some recipes. Could you tell me what ingredients you have available?";
        }
        
        // Convert ingredients to lowercase for case-insensitive matching
        $ingredients = array_map('strtolower', $ingredients);
        
        // Filter recipes based on ingredients
        $matchedRecipes = [];
        foreach ($this->recipeDatabase as $recipe) {
            // Count how many of the requested ingredients are in this recipe
            $matchedIngredientCount = 0;
            foreach ($ingredients as $ingredient) {
                foreach ($recipe['ingredients'] as $recipeIngredient) {
                    if (stripos($recipeIngredient['name'], $ingredient) !== false) {
                        $matchedIngredientCount++;
                        break;
                    }
                }
            }
            
            // If at least one ingredient matches, add to results
            if ($matchedIngredientCount > 0) {
                // Calculate a match score (higher is better)
                $matchScore = $matchedIngredientCount / count($recipe['ingredients']);
                
                // Check dietary restrictions if specified
                $meetsRestrictions = true;
                if ($dietaryInfo) {
                    $dietaryInfo = strtolower($dietaryInfo);
                    
                    // Check if recipe conflicts with dietary restrictions
                    if (stripos($dietaryInfo, 'vegetarian') !== false && $recipe['tags']['vegetarian'] === false) {
                        $meetsRestrictions = false;
                    }
                    
                    if (stripos($dietaryInfo, 'vegan') !== false && $recipe['tags']['vegan'] === false) {
                        $meetsRestrictions = false;
                    }
                    
                    if (stripos($dietaryInfo, 'gluten') !== false && $recipe['tags']['gluten_free'] === false) {
                        $meetsRestrictions = false;
                    }
                }
                
                // Also check user's stored dietary restrictions
                foreach ($this->userProfile['dietaryRestrictions'] as $restriction) {
                    $restriction = strtolower($restriction);
                    
                    if ($restriction === 'vegetarian' && $recipe['tags']['vegetarian'] === false) {
                        $meetsRestrictions = false;
                    }
                    
                    if ($restriction === 'vegan' && $recipe['tags']['vegan'] === false) {
                        $meetsRestrictions = false;
                    }
                    
                    if ($restriction === 'gluten-free' && $recipe['tags']['gluten_free'] === false) {
                        $meetsRestrictions = false;
                    }
                }
                
                // Check allergens
                foreach ($this->userProfile['allergies'] as $allergen) {
                    foreach ($recipe['ingredients'] as $recipeIngredient) {
                        if (stripos($recipeIngredient['name'], $allergen) !== false) {
                            $meetsRestrictions = false;
                            break;
                        }
                    }
                }
                
                if ($meetsRestrictions) {
                    $matchedRecipes[] = [
                        'recipe' => $recipe,
                        'score' => $matchScore,
                        'matched_ingredients' => $matchedIngredientCount
                    ];
                }
            }
        }
        
        // Sort by match score (highest first)
        usort($matchedRecipes, function($a, $b) {
            return $b['score'] <=> $a['score'];
        });
        
        // Limit to top 3 matches
        $matchedRecipes = array_slice($matchedRecipes, 0, 3);
        
        if (empty($matchedRecipes)) {
            return "I couldn't find any recipes that match your ingredients" . 
                   ($dietaryInfo ? " and dietary preferences" : "") . 
                   ". Could you try with different ingredients or fewer restrictions?";
        }
        
        // Format response
        $response = "Here are some recipes you can make with those ingredients:\n\n";
        
        foreach ($matchedRecipes as $index => $match) {
            $recipe = $match['recipe'];
            $response .= ($index + 1) . ". {$recipe['name']}\n";
            $response .= "   Prep time: {$recipe['prep_time']} mins | Cook time: {$recipe['cook_time']} mins\n";
            $response .= "   You have {$match['matched_ingredients']} of " . count($recipe['ingredients']) . " ingredients\n";
            
            // Add dietary tags
            $tags = [];
            if ($recipe['tags']['vegetarian']) $tags[] = "vegetarian";
            if ($recipe['tags']['vegan']) $tags[] = "vegan";
            if ($recipe['tags']['gluten_free']) $tags[] = "gluten-free";
            
            if (!empty($tags)) {
                $response .= "   Tags: " . implode(", ", $tags) . "\n";
            }
            
            $response .= "\n";
        }
        
        $response .= "Would you like the full recipe for any of these? Just ask for the instructions.";
        
        return $response;
    }
    
    /**
     * Get recipe instructions
     * 
     * @param array $intent Intent data
     * @return string Recipe instructions
     */
    private function getRecipeInstructions($intent) {
        $recipeName = $intent['recipe_name'] ?? null;
        
        if (!$recipeName) {
            return "Which recipe would you like instructions for?";
        }
        
        // Find the recipe
        $recipe = null;
        foreach ($this->recipeDatabase as $r) {
            if (stripos($r['name'], $recipeName) !== false) {
                $recipe = $r;
                break;
            }
        }
        
        if (!$recipe) {
            return "I couldn't find a recipe for \"$recipeName\". Could you check the spelling or ask for a different recipe?";
        }
        
        // Format ingredients list
        $ingredientsList = "";
        foreach ($recipe['ingredients'] as $ingredient) {
            $ingredientsList .= "- {$ingredient['amount']} {$ingredient['unit']} {$ingredient['name']}\n";
        }
        
        // Format instructions
        $instructionsList = "";
        foreach ($recipe['instructions'] as $index => $step) {
            $instructionsList .= ($index + 1) . ". {$step}\n";
        }
        
        // Create the response
        $response = "# {$recipe['name']}\n\n";
        $response .= "Prep time: {$recipe['prep_time']} mins | Cook time: {$recipe['cook_time']} mins | Servings: {$recipe['servings']}\n\n";
        
        // Add dietary tags
        $tags = [];
        if ($recipe['tags']['vegetarian']) $tags[] = "vegetarian";
        if ($recipe['tags']['vegan']) $tags[] = "vegan";
        if ($recipe['tags']['gluten_free']) $tags[] = "gluten-free";
        
        if (!empty($tags)) {
            $response .= "Tags: " . implode(", ", $tags) . "\n\n";
        }
        
        $response .= "## Ingredients\n\n";
        $response .= $ingredientsList . "\n";
        $response .= "## Instructions\n\n";
        $response .= $instructionsList . "\n";
        $response .= "Enjoy your meal! You can ask me to adjust servings or suggest substitutions if needed.";
        
        return $response;
    }
    
    /**
     * Suggest ingredient substitutions
     * 
     * @param array $intent Intent data
     * @param string $originalMessage Original user message
     * @return string Substitution suggestions
     */
    private function suggestSubstitutions($intent, $originalMessage) {
        // For this demo, we'll use Venice AI to generate substitutions
        // In a production app, you might have a database of common substitutions
        
        $systemPrompt = "You are a cooking expert who specializes in ingredient substitutions. " .
                        "Provide helpful, accurate suggestions for ingredient substitutions. " .
                        "Include explanations of how the substitution will affect the recipe. " .
                        "Be specific about measurements and equivalents. " .
                        "Limit your response to the most appropriate 2-3 substitution options.";
        
        $messages = [
            ['role' => 'system', 'content' => $systemPrompt],
            ['role' => 'user', 'content' => $originalMessage]
        ];
        
        try {
            // Get response from Venice AI
            $response = $this->venice->createChatCompletion($messages);
            
            // Return response
            return $response['choices'][0]['message']['content'];
        } catch (Exception $e) {
            return "I'm sorry, I'm having trouble generating substitution suggestions right now. " .
                   "Please try again or ask about a specific ingredient.";
        }
    }
    
    /**
     * Adjust recipe servings
     * 
     * @param array $intent Intent data
     * @return string Adjusted recipe
     */
    private function adjustServings($intent) {
        $recipeName = $intent['recipe_name'] ?? null;
        $servings = $intent['servings'] ?? null;
        
        if (!$recipeName || !$servings) {
            return "To adjust servings, please specify both the recipe name and the number of servings.";
        }
        
        // Find the recipe
        $recipe = null;
        foreach ($this->recipeDatabase as $r) {
            if (stripos($r['name'], $recipeName) !== false) {
                $recipe = $r;
                break;
            }
        }
        
        if (!$recipe) {
            return "I couldn't find a recipe for \"$recipeName\". Could you check the spelling or ask for a different recipe?";
        }
        
        // Calculate scaling factor
        $scalingFactor = $servings / $recipe['servings'];
        
        // Adjust ingredients
        $adjustedIngredients = [];
        foreach ($recipe['ingredients'] as $ingredient) {
            $adjustedAmount = $ingredient['amount'] * $scalingFactor;
            
            // Round to 2 decimal places if needed
            if ($adjustedAmount == floor($adjustedAmount)) {
                $adjustedAmount = (int)$adjustedAmount;
            } elseif ($adjustedAmount * 2 == floor($adjustedAmount * 2)) {
                $adjustedAmount = number_format($adjustedAmount, 1);
            } else {
                $adjustedAmount = number_format($adjustedAmount, 2);
            }
            
            $adjustedIngredients[] = [
                'amount' => $adjustedAmount,
                'unit' => $ingredient['unit'],
                'name' => $ingredient['name']
            ];
        }
        
        // Format ingredients list
        $ingredientsList = "";
        foreach ($adjustedIngredients as $ingredient) {
            $ingredientsList .= "- {$ingredient['amount']} {$ingredient['unit']} {$ingredient['name']}\n";
        }
        
        // Create the response
        $response = "# {$recipe['name']} (Adjusted for $servings servings)\n\n";
        $response .= "Original recipe was for {$recipe['servings']} servings. Here are the adjusted ingredients:\n\n";
        $response .= $ingredientsList . "\n";
        $response .= "The cooking instructions remain the same. Would you like me to show those as well?";
        
        return $response;
    }
    
    /**
     * Answer a cooking question
     * 
     * @param string $question The cooking question
     * @return string Answer
     */
    private function answerCookingQuestion($question) {
        // Use Venice AI to generate an answer to the cooking question
        
        $systemPrompt = "You are a cooking expert who provides accurate, helpful answers to cooking questions. " .
                        "Your answers should be clear, concise, and useful for home cooks. " .
                        "When appropriate, explain the science or technique behind your answer. " .
                        "If there are multiple approaches, mention the pros and cons of each. " .
                        "If you're unsure, acknowledge the limitations of your knowledge.";
        
        $messages = [
            ['role' => 'system', 'content' => $systemPrompt],
            ['role' => 'user', 'content' => $question]
        ];
        
        try {
            // Get response from Venice AI
            $response = $this->venice->createChatCompletion($messages);
            
            // Return response
            return $response['choices'][0]['message']['content'];
        } catch (Exception $e) {
            return "I'm sorry, I'm having trouble answering your cooking question right now. " .
                   "Please try again with a more specific question.";
        }
    }
    
    /**
     * Update user preferences
     * 
     * @param array $intent Intent data
     * @return string Confirmation message
     */
    private function updatePreferences($intent) {
        $dietaryInfo = $intent['dietary_info'] ?? null;
        
        if (!$dietaryInfo) {
            return "I'd be happy to update your dietary preferences. " .
                   "Please let me know if you have any dietary restrictions, preferences, or allergies.";
        }
        
        // Use Venice AI to parse the dietary information
        $systemPrompt = "You are an assistant that helps update user dietary preferences. " .
                        "Analyze the text and extract dietary restrictions, preferences, and allergies. " .
                        "Respond with a JSON object with this structure:\n" .
                        "{\n" .
                        "  \"preferences\": [list of food preferences],\n" .
                        "  \"restrictions\": [list of dietary restrictions like 'vegetarian', 'vegan', 'gluten-free'],\n" .
                        "  \"allergies\": [list of food allergies]\n" .
                        "}\n" .
                        "Provide only the JSON without any additional text.";
        
        $messages = [
            ['role' => 'system', 'content' => $systemPrompt],
            ['role' => 'user', 'content' => $dietaryInfo]
        ];
        
        try {
            // Get response from Venice AI
            $response = $this->venice->createChatCompletion($messages);
            
            // Parse the response
            $content = $response['choices'][0]['message']['content'];
            $dietaryData = json_decode($content, true);
            
            if (is_array($dietaryData)) {
                // Update user profile
                if (isset($dietaryData['preferences']) && is_array($dietaryData['preferences'])) {
                    $this->userProfile['preferences'] = array_unique(
                        array_merge($this->userProfile['preferences'], $dietaryData['preferences'])
                    );
                }
                
                if (isset($dietaryData['restrictions']) && is_array($dietaryData['restrictions'])) {
                    $this->userProfile['dietaryRestrictions'] = array_unique(
                        array_merge($this->userProfile['dietaryRestrictions'], $dietaryData['restrictions'])
                    );
                }
                
                if (isset($dietaryData['allergies']) && is_array($dietaryData['allergies'])) {
                    $this->userProfile['allergies'] = array_unique(
                        array_merge($this->userProfile['allergies'], $dietaryData['allergies'])
                    );
                }
                
                // Save user profile
                $this->saveUserProfile();
                
                // Generate confirmation message
                $confirmation = "I've updated your dietary information. Here's what I know about your preferences now:\n\n";
                $confirmation .= $this->formatUserProfile();
                
                return $confirmation;
            }
        } catch (Exception $e) {
            // Fall back to a simpler approach
        }
        
        // Simple fallback approach
        if (stripos($dietaryInfo, 'vegetarian') !== false) {
            $this->userProfile['dietaryRestrictions'][] = 'vegetarian';
        }
        
        if (stripos($dietaryInfo, 'vegan') !== false) {
            $this->userProfile['dietaryRestrictions'][] = 'vegan';
        }
        
        if (stripos($dietaryInfo, 'gluten') !== false) {
            $this->userProfile['dietaryRestrictions'][] = 'gluten-free';
        }
        
        // Save user profile
        $this->saveUserProfile();
        
        return "I've updated your dietary preferences. You can say 'show my profile' to see what I know about your preferences.";
    }
    
    /**
     * Generate a conversational response for general queries
     * 
     * @param string $message User message
     * @return string Response
     */
    private function generateConversationalResponse($message) {
        // Prepare system prompt
        $systemPrompt = "You are a friendly recipe assistant who helps with cooking and food-related questions. " .
                        "Respond conversationally but keep your answers focused on cooking, recipes, and food. " .
                        "If the user's question is not related to cooking or food, politely redirect the conversation " .
                        "back to your area of expertise. Your goal is to be helpful with cooking-related topics.";
        
        // Get user profile highlights
        $profileInfo = "";
        if (!empty($this->userProfile['dietaryRestrictions'])) {
            $profileInfo .= "User's dietary restrictions: " . implode(", ", $this->userProfile['dietaryRestrictions']) . ". ";
        }
        
        if (!empty($this->userProfile['allergies'])) {
            $profileInfo .= "User's food allergies: " . implode(", ", $this->userProfile['allergies']) . ". ";
        }
        
        if (!empty($profileInfo)) {
            $systemPrompt .= "\n\nUser information: " . $profileInfo;
        }
        
        // Create messages array
        $messages = [
            ['role' => 'system', 'content' => $systemPrompt]
        ];
        
        // Add recent conversation history for context
        $recentHistory = array_slice($this->conversationHistory, -6);
        $messages = array_merge($messages, $recentHistory);
        
        try {
            // Get response from Venice AI
            $response = $this->venice->createChatCompletion($messages);
            
            // Return response
            return $response['choices'][0]['message']['content'];
        } catch (Exception $e) {
            return "I'm sorry, I'm having trouble responding right now. Can you try asking something else about cooking or recipes?";
        }
    }
    
    /**
     * Format user profile as a readable string
     * 
     * @return string Formatted user profile
     */
    private function formatUserProfile() {
        $profile = "Your Food Profile:\n\n";
        
        if (empty($this->userProfile['preferences']) && 
            empty($this->userProfile['allergies']) && 
            empty($this->userProfile['dietaryRestrictions']) &&
            empty($this->userProfile['favoriteRecipes'])) {
            return "I don't have any information about your food preferences yet. " .
                   "You can tell me about your dietary restrictions, allergies, or food preferences.";
        }
        
        if (!empty($this->userProfile['dietaryRestrictions'])) {
            $profile .= "Dietary Restrictions: " . implode(", ", $this->userProfile['dietaryRestrictions']) . "\n\n";
        }
        
        if (!empty($this->userProfile['allergies'])) {
            $profile .= "Allergies: " . implode(", ", $this->userProfile['allergies']) . "\n\n";
        }
        
        if (!empty($this->userProfile['preferences'])) {
            $profile .= "Food Preferences: " . implode(", ", $this->userProfile['preferences']) . "\n\n";
        }
        
        if (!empty($this->userProfile['favoriteRecipes'])) {
            $profile .= "Favorite Recipes: " . count($this->userProfile['favoriteRecipes']) . 
                       " (say 'show my favorite recipes' to see them)\n\n";
        }
        
        return $profile;
    }
    
    /**
     * List favorite recipes
     * 
     * @return string List of favorite recipes
     */
    private function listFavoriteRecipes() {
        if (empty($this->userProfile['favoriteRecipes'])) {
            return "You don't have any favorite recipes yet. You can add a recipe to your favorites by saying 'save this recipe as favorite'.";
        }
        
        $favoriteRecipes = [];
        foreach ($this->userProfile['favoriteRecipes'] as $recipeId) {
            foreach ($this->recipeDatabase as $recipe) {
                if ($recipe['id'] === $recipeId) {
                    $favoriteRecipes[] = $recipe;
                    break;
                }
            }
        }
        
        if (empty($favoriteRecipes)) {
            return "You have favorite recipes saved, but I couldn't find them in the database. This might be a technical issue.";
        }
        
        $response = "Your Favorite Recipes:\n\n";
        
        foreach ($favoriteRecipes as $index => $recipe) {
            $response .= ($index + 1) . ". {$recipe['name']}\n";
            $response .= "   Prep time: {$recipe['prep_time']} mins | Cook time: {$recipe['cook_time']} mins\n\n";
        }
        
        $response .= "Would you like the full recipe for any of these? Just ask for the instructions.";
        
        return $response;
    }
    
    /**
     * Initialize sample recipes
     */
    private function initializeSampleRecipes() {
        $this->recipeDatabase = [
            [
                'id' => 'pasta-carbonara-1',
                'name' => 'Pasta Carbonara',
                'prep_time' => 15,
                'cook_time' => 15,
                'servings' => 4,
                'ingredients' => [
                    ['amount' => 1, 'unit' => 'lb', 'name' => 'spaghetti'],
                    ['amount' => 4, 'unit' => '', 'name' => 'large eggs'],
                    ['amount' => 8, 'unit' => 'oz', 'name' => 'pancetta or bacon, diced'],
                    ['amount' => 1, 'unit' => 'cup', 'name' => 'Parmesan cheese, grated'],
                    ['amount' => 4, 'unit' => 'cloves', 'name' => 'garlic, minced'],
                    ['amount' => 1, 'unit' => 'tsp', 'name' => 'black pepper, freshly ground'],
                    ['amount' => 1, 'unit' => 'tsp', 'name' => 'salt']
                ],
                'instructions' => [
                    'Bring a large pot of salted water to a boil. Add the spaghetti and cook until al dente, about 8-10 minutes.',
                    'Meanwhile, in a large bowl, whisk together the eggs, grated Parmesan cheese, and black pepper. Set aside.',
                    'In a large skillet, cook the pancetta over medium heat until crispy, about 5-7 minutes. Add minced garlic and cook for another 30 seconds until fragrant.',
                    'Drain the pasta, reserving 1/2 cup of the pasta water.',
                    'Working quickly, add the hot pasta to the skillet with the pancetta and garlic. Toss to combine.',
                    'Remove the skillet from heat and immediately add the egg and cheese mixture, stirring continuously to coat the pasta. The residual heat will cook the eggs into a creamy sauce. If needed, add some reserved pasta water to achieve desired consistency.',
                    'Season with additional salt and pepper to taste. Serve immediately with extra Parmesan cheese on top.'
                ],
                'tags' => [
                    'vegetarian' => false,
                    'vegan' => false,
                    'gluten_free' => false
                ]
            ],
            [
                'id' => 'veg-stir-fry-1',
                'name' => 'Vegetable Stir Fry',
                'prep_time' => 20,
                'cook_time' => 10,
                'servings' => 4,
                'ingredients' => [
                    ['amount' => 2, 'unit' => 'cups', 'name' => 'broccoli florets'],
                    ['amount' => 1, 'unit' => '', 'name' => 'red bell pepper, sliced'],
                    ['amount' => 1, 'unit' => '', 'name' => 'yellow bell pepper, sliced'],
                    ['amount' => 2, 'unit' => '', 'name' => 'carrots, julienned'],
                    ['amount' => 1, 'unit' => 'cup', 'name' => 'snow peas'],
                    ['amount' => 1, 'unit' => '', 'name' => 'onion, sliced'],
                    ['amount' => 3, 'unit' => 'cloves', 'name' => 'garlic, minced'],
                    ['amount' => 1, 'unit' => 'tbsp', 'name' => 'ginger, minced'],
                    ['amount' => 3, 'unit' => 'tbsp', 'name' => 'soy sauce'],
                    ['amount' => 1, 'unit' => 'tbsp', 'name' => 'sesame oil'],
                    ['amount' => 2, 'unit' => 'tbsp', 'name' => 'vegetable oil'],
                    ['amount' => 1, 'unit' => 'tbsp', 'name' => 'cornstarch'],
                    ['amount' => 1/4, 'unit' => 'cup', 'name' => 'water'],
                    ['amount' => 1, 'unit' => 'tbsp', 'name' => 'honey or maple syrup']
                ],
                'instructions' => [
                    'In a small bowl, mix together soy sauce, sesame oil, cornstarch, water, and honey to make the sauce. Set aside.',
                    'Heat vegetable oil in a large wok or skillet over high heat.',
                    'Add minced garlic and ginger, stir-fry for 30 seconds until fragrant.',
                    'Add onions and stir-fry for 1 minute.',
                    'Add carrots and cook for 2 minutes.',
                    'Add broccoli, bell peppers, and snow peas. Stir-fry for 3-4 minutes until vegetables are crisp-tender.',
                    'Pour the sauce over the vegetables and toss to coat. Cook for another 1-2 minutes until the sauce thickens.',
                    'Serve immediately over rice or noodles.'
                ],
                'tags' => [
                    'vegetarian' => true,
                    'vegan' => false,
                    'gluten_free' => false
                ]
            ],
            [
                'id' => 'choc-chip-cookies-1',
                'name' => 'Chocolate Chip Cookies',
                'prep_time' => 15,
                'cook_time' => 12,
                'servings' => 24,
                'ingredients' => [
                    ['amount' => 1, 'unit' => 'cup', 'name' => 'butter, softened'],
                    ['amount' => 3/4, 'unit' => 'cup', 'name' => 'white sugar'],
                    ['amount' => 3/4, 'unit' => 'cup', 'name' => 'brown sugar, packed'],
                    ['amount' => 2, 'unit' => '', 'name' => 'large eggs'],
                    ['amount' => 2, 'unit' => 'tsp', 'name' => 'vanilla extract'],
                    ['amount' => 2.25, 'unit' => 'cups', 'name' => 'all-purpose flour'],
                    ['amount' => 1, 'unit' => 'tsp', 'name' => 'baking soda'],
                    ['amount' => 1, 'unit' => 'tsp', 'name' => 'salt'],
                    ['amount' => 2, 'unit' => 'cups', 'name' => 'chocolate chips'],
                    ['amount' => 1, 'unit' => 'cup', 'name' => 'walnuts, chopped (optional)']
                ],
                'instructions' => [
                    'Preheat oven to 375°F (190°C).',
                    'In a large bowl, cream together the butter, white sugar, and brown sugar until smooth.',
                    'Beat in the eggs one at a time, then stir in the vanilla.',
                    'In a separate bowl, combine flour, baking soda, and salt. Gradually add to the wet ingredients and mix well.',
                    'Fold in the chocolate chips and walnuts if using.',
                    'Drop by rounded tablespoons onto ungreased baking sheets.',
                    'Bake for 9 to 11 minutes or until golden brown.',
                    'Allow cookies to cool on baking sheet for 2 minutes before removing to wire racks to cool completely.'
                ],
                'tags' => [
                    'vegetarian' => true,
                    'vegan' => false,
                    'gluten_free' => false
                ]
            ],
            [
                'id' => 'quinoa-salad-1',
                'name' => 'Mediterranean Quinoa Salad',
                'prep_time' => 15,
                'cook_time' => 20,
                'servings' => 6,
                'ingredients' => [
                    ['amount' => 1, 'unit' => 'cup', 'name' => 'quinoa, rinsed'],
                    ['amount' => 2, 'unit' => 'cups', 'name' => 'water'],
                    ['amount' => 1, 'unit' => '', 'name' => 'cucumber, diced'],
                    ['amount' => 1, 'unit' => 'cup', 'name' => 'cherry tomatoes, halved'],
                    ['amount' => 1/2, 'unit' => 'cup', 'name' => 'red onion, finely diced'],
                    ['amount' => 1/2, 'unit' => 'cup', 'name' => 'Kalamata olives, pitted and sliced'],
                    ['amount' => 1/2, 'unit' => 'cup', 'name' => 'feta cheese, crumbled'],
                    ['amount' => 1/4, 'unit' => 'cup', 'name' => 'fresh parsley, chopped'],
                    ['amount' => 1/4, 'unit' => 'cup', 'name' => 'olive oil'],
                    ['amount' => 3, 'unit' => 'tbsp', 'name' => 'lemon juice'],
                    ['amount' => 2, 'unit' => 'cloves', 'name' => 'garlic, minced'],
                    ['amount' => 1, 'unit' => 'tsp', 'name' => 'dried oregano'],
                    ['amount' => 1/2, 'unit' => 'tsp', 'name' => 'salt'],
                    ['amount' => 1/4, 'unit' => 'tsp', 'name' => 'black pepper']
                ],
                'instructions' => [
                    'In a medium saucepan, combine quinoa and water. Bring to a boil, then reduce heat to low, cover, and simmer for 15 minutes until water is absorbed.',
                    'Remove from heat and let stand, covered, for 5 minutes. Fluff with a fork and let cool to room temperature.',
                    'In a large bowl, combine cooled quinoa, cucumber, tomatoes, red onion, olives, feta cheese, and parsley.',
                    'In a small bowl, whisk together olive oil, lemon juice, garlic, oregano, salt, and pepper to make the dressing.',
                    'Pour the dressing over the salad and toss to combine.',
                    'Refrigerate for at least 30 minutes before serving to allow flavors to meld.'
                ],
                'tags' => [
                    'vegetarian' => true,
                    'vegan' => false,
                    'gluten_free' => true
                ]
            ],
            [
                'id' => 'chicken-tacos-1',
                'name' => 'Easy Chicken Tacos',
                'prep_time' => 20,
                'cook_time' => 25,
                'servings' => 4,
                'ingredients' => [
                    ['amount' => 1.5, 'unit' => 'lbs', 'name' => 'boneless, skinless chicken breasts'],
                    ['amount' => 2, 'unit' => 'tbsp', 'name' => 'olive oil'],
                    ['amount' => 1, 'unit' => 'packet', 'name' => 'taco seasoning'],
                    ['amount' => 1/4, 'unit' => 'cup', 'name' => 'water'],
                    ['amount' => 8, 'unit' => '', 'name' => 'small flour or corn tortillas'],
                    ['amount' => 1, 'unit' => 'cup', 'name' => 'lettuce, shredded'],
                    ['amount' => 1, 'unit' => 'cup', 'name' => 'tomatoes, diced'],
                    ['amount' => 1/2, 'unit' => 'cup', 'name' => 'red onion, diced'],
                    ['amount' => 1, 'unit' => 'cup', 'name' => 'cheddar cheese, shredded'],
                    ['amount' => 1/2, 'unit' => 'cup', 'name' => 'sour cream'],
                    ['amount' => 1, 'unit' => '', 'name' => 'avocado, sliced'],
                    ['amount' => 1/4, 'unit' => 'cup', 'name' => 'cilantro, chopped'],
                    ['amount' => 1, 'unit' => '', 'name' => 'lime, cut into wedges']
                ],
                'instructions' => [
                    'Cut chicken breasts into small pieces.',
                    'Heat olive oil in a large skillet over medium-high heat.',
                    'Add chicken and cook until no longer pink, about 6-7 minutes.',
                    'Sprinkle taco seasoning over the chicken and add water. Stir to combine.',
                    'Reduce heat to medium-low and simmer for 5 minutes, or until the sauce has thickened.',
                    'Warm tortillas in a dry skillet or microwave.',
                    'Assemble tacos by placing chicken in each tortilla and topping with lettuce, tomatoes, onion, cheese, sour cream, avocado, and cilantro.',
                    'Serve with lime wedges on the side.'
                ],
                'tags' => [
                    'vegetarian' => false,
                    'vegan' => false,
                    'gluten_free' => false
                ]
            ]
        ];
    }
    
    /**
     * Load user profile from file
     */
    private function loadUserProfile() {
        if (file_exists($this->profileFile)) {
            $content = file_get_contents($this->profileFile);
            $data = json_decode($content, true);
            
            if (is_array($data)) {
                $this->userProfile = array_merge($this->userProfile, $data);
            }
        }
    }
    
    /**
     * Save user profile to file
     */
    private function saveUserProfile() {
        // Remove duplicates in arrays
        foreach (['preferences', 'allergies', 'dietaryRestrictions', 'favoriteRecipes'] as $key) {
            if (isset($this->userProfile[$key]) && is_array($this->userProfile[$key])) {
                $this->userProfile[$key] = array_unique($this->userProfile[$key]);
            }
        }
        
        file_put_contents($this->profileFile, json_encode($this->userProfile, JSON_PRETTY_PRINT));
    }
    
    /**
     * Load recipe database from file
     */
    private function loadRecipeDatabase() {
        if (file_exists($this->recipeDatabaseFile)) {
            $content = file_get_contents($this->recipeDatabaseFile);
            $data = json_decode($content, true);
            
            if (is_array($data)) {
                $this->recipeDatabase = $data;
            }
        }
    }
    
    /**
     * Save recipe database to file
     */
    private function saveRecipeDatabase() {
        file_put_contents($this->recipeDatabaseFile, json_encode($this->recipeDatabase, JSON_PRETTY_PRINT));
    }
    
    /**
     * Add message to conversation history
     * 
     * @param string $role Role ('user' or 'assistant')
     * @param string $content Message content
     */
    private function addToHistory($role, $content) {
        $this->conversationHistory[] = [
            'role' => $role,
            'content' => $content
        ];
        
        // Limit history size
        if (count($this->conversationHistory) > 20) {
            array_shift($this->conversationHistory);
        }
    }
}
```

## How to Use This Agent

1. Save the code above as `recipe_agent.php`
2. Create a simple CLI interface to interact with the agent:

```php
<?php
// Include the agent class
require_once 'recipe_agent.php';

// Replace with your Venice AI API key
$apiKey = 'your_venice_api_key_here';

// Create a new recipe agent
$agent = new RecipeAgent($apiKey);

// Simple command-line interface
echo "Recipe Assistant Agent (type 'exit' to quit)\n";
echo "---------------------------------------------\n";
echo "Type 'help' to see what I can do\n\n";

while (true) {
    // Get user input
    echo "You: ";
    $input = trim(fgets(STDIN));
    
    // Exit if requested
    if (strtolower($input) === 'exit') {
        break;
    }
    
    // Get response from agent
    $response = $agent->processMessage($input);
    
    // Display response
    echo "Agent: " . $response . "\n\n";
}
```

3. Run the script from the command line:
```
php recipe_cli.php
```

## Example Interactions

```
You: What can I make with chicken and potatoes?
Agent: Here are some recipes you can make with those ingredients:

1. Easy Chicken Tacos
   Prep time: 20 mins | Cook time: 25 mins
   You have 1 of 13 ingredients
   Tags: 

2. Mediterranean Quinoa Salad
   Prep time: 15 mins | Cook time: 20 mins
   You have 0 of 14 ingredients
   Tags: vegetarian, gluten-free

Would you like the full recipe for any of these? Just ask for the instructions.

You: Give me the recipe for chicken tacos
Agent: # Easy Chicken Tacos

Prep time: 20 mins | Cook time: 25 mins | Servings: 4

## Ingredients

- 1.5 lbs boneless, skinless chicken breasts
- 2 tbsp olive oil
- 1 packet taco seasoning
- 0.25 cup water
- 8  small flour or corn tortillas
- 1 cup lettuce, shredded
- 1 cup tomatoes, diced
- 0.5 cup red onion, diced
- 1 cup cheddar cheese, shredded
- 0.5 cup sour cream
- 1  avocado, sliced
- 0.25 cup cilantro, chopped
- 1  lime, cut into wedges

## Instructions

1. Cut chicken breasts into small pieces.
2. Heat olive oil in a large skillet over medium-high heat.
3. Add chicken and cook until no longer pink, about 6-7 minutes.
4. Sprinkle taco seasoning over the chicken and add water. Stir to combine.
5. Reduce heat to medium-low and simmer for 5 minutes, or until the sauce has thickened.
6. Warm tortillas in a dry skillet or microwave.
7. Assemble tacos by placing chicken in each tortilla and topping with lettuce, tomatoes, onion, cheese, sour cream, avocado, and cilantro.
8. Serve with lime wedges on the side.

Enjoy your meal! You can ask me to adjust servings or suggest substitutions if needed.

You: I'm a vegetarian, what can I make?
Agent: Here are some recipes you can make that are vegetarian:

1. Vegetable Stir Fry
   Prep time: 20 mins | Cook time: 10 mins
   Tags: vegetarian

2. Chocolate Chip Cookies
   Prep time: 15 mins | Cook time: 12 mins
   Tags: vegetarian

3. Mediterranean Quinoa Salad
   Prep time: 15 mins | Cook time: 20 mins
   Tags: vegetarian, gluten-free

Would you like the full recipe for any of these? Just ask for the instructions.

You: I'm allergic to nuts
Agent: I've updated your dietary information. Here's what I know about your preferences now:

Your Food Profile:

Allergies: nuts

You: Show me the chocolate chip cookie recipe
Agent: # Chocolate Chip Cookies

Prep time: 15 mins | Cook time: 12 mins | Servings: 24

Tags: vegetarian

## Ingredients

- 1 cup butter, softened
- 0.75 cup white sugar
- 0.75 cup brown sugar, packed
- 2  large eggs
- 2 tsp vanilla extract
- 2.25 cups all-purpose flour
- 1 tsp baking soda
- 1 tsp salt
- 2 cups chocolate chips
- 1 cup walnuts, chopped (optional)

## Instructions

1. Preheat oven to 375°F (190°C).
2. In a large bowl, cream together the butter, white sugar, and brown sugar until smooth.
3. Beat in the eggs one at a time, then stir in the vanilla.
4. In a separate bowl, combine flour, baking soda, and salt. Gradually add to the wet ingredients and mix well.
5. Fold in the chocolate chips and walnuts if using.
6. Drop by rounded tablespoons onto ungreased baking sheets.
7. Bake for 9 to 11 minutes or until golden brown.
8. Allow cookies to cool on baking sheet for 2 minutes before removing to wire racks to cool completely.

Enjoy your meal! You can ask me to adjust servings or suggest substitutions if needed.

You: I should skip the walnuts since I'm allergic to nuts
Agent: You're absolutely right! Since you have a nut allergy, you should definitely skip the walnuts in this recipe. The chocolate chip cookies will still be delicious without them. 

The recipe mentions that the walnuts are optional, so you can simply omit them without needing to make any other adjustments to the recipe. The cookies will still have great flavor and texture from the butter, sugars, and chocolate chips.

Would you like me to adjust the recipe for any specific number of servings or do you have any other questions about making these cookies?
```

## Key Learning Points

1. **Domain Specialization** - This agent focuses specifically on recipes and cooking, with specialized functions for that domain.

2. **Simulated Database** - The agent uses a simulated recipe database that could be replaced with a real API or database in a production environment.

3. **User Profiling** - The agent maintains a profile of user preferences, allergies, and dietary restrictions.

4. **Content-Aware Responses** - The agent adjusts recommendations based on user preferences and dietary restrictions.

5. **Specialized Functions** - The agent provides domain-specific functions like recipe adjustment and ingredient substitution.

## Extending This Agent

This specialized agent could be extended in several ways:

1. **Real Recipe API** - Connect to a real recipe API instead of using a simulated database.

2. **Image Generation** - Add the ability to generate images of recipes using Venice AI's image generation capabilities.

3. **Meal Planning** - Add functions for creating weekly meal plans based on user preferences.

4. **Nutrition Information** - Add nutritional data to recipes and ability to filter by nutritional criteria.

5. **Shopping Lists** - Generate shopping lists from recipes.

6. **Smart Kitchen Integration** - Connect with smart kitchen devices for cooking assistance.

7. **Voice Interface** - Add voice interaction for hands-free cooking assistance.

8. **Multi-Language Support** - Add support for recipes in multiple languages.

## Conclusion

This specialized recipe agent demonstrates how AI agents can be tailored to specific domains, providing deep expertise in a particular area. Unlike general-purpose assistants, specialized agents can offer more detailed and accurate information within their domain of expertise.

The domain-specific knowledge is implemented through:

1. A specialized database of information (recipes)
2. Domain-specific functions (recipe adjustment, substitutions)
3. User profiling specific to the domain (dietary preferences)
4. Contextual awareness of domain-specific concerns (allergies, restrictions)

This approach allows for creating agents that excel in particular niches, rather than trying to be good at everything. Users benefit from deeper expertise and more tailored assistance in the specific domain they're interested in.
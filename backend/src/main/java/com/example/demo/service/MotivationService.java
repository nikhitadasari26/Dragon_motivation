package com.example.demo.service;

import com.example.demo.model.Mood;
import com.example.demo.model.User;
import com.example.demo.repository.MoodRepository;
import com.example.demo.repository.TaskRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

@Service
public class MotivationService {

    private final MoodRepository moodRepository;
    private final TaskRepository taskRepository;
    private final RestTemplate restTemplate;

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    public MotivationService(MoodRepository moodRepository, TaskRepository taskRepository) {
        this.moodRepository = moodRepository;
        this.taskRepository = taskRepository;
        this.restTemplate = new RestTemplate();
    }

    public Map<String, String> generateMotivation(User user, String decisionPath) {
        Mood.MoodType mood = moodRepository.findTopByUserIdOrderByCreatedAtDesc(user.getId())
                .map(Mood::getMoodType)
                .orElse(Mood.MoodType.NORMAL);

        long totalTasks = taskRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).size();
        long completedTasks = taskRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .filter(t -> t.isCompleted()).count();

        // 1. Check if Gemini Key is configured for live AI generation
        if (geminiApiKey != null && !geminiApiKey.trim().isEmpty()) {
            try {
                return generateWithGemini(user, mood, completedTasks, totalTasks, decisionPath);
            } catch (Exception e) {
                System.err.println("Gemini generation failed, falling back to offline engine: " + e.getMessage());
            }
        }

        // 2. Fall back to offline dynamic rules-based engine
        return generateOffline(user, mood, completedTasks, totalTasks, decisionPath);
    }

    private Map<String, String> generateWithGemini(
            User user,
            Mood.MoodType mood,
            long completed,
            long total,
            String path
    ) {
        String prompt = String.format(
                "You are an encouraging cartoon dragon companion inside a gamified task app called 'Dragon Motivation'. " +
                "Write a highly motivating message and a longer supportive story in simple English for a user with the following profile:\n" +
                "- Name: %s\n" +
                "- Dragon growth stage: %s\n" +
                "- Today's progress: %d completed out of %d total tasks\n" +
                "- Current mood: %s\n" +
                "- Action completed: Just checked off a task! They selected they %s.\n\n" +
                "Requirements:\n" +
                "1. Keep it extremely warm, cute, cheerful, and motivational.\n" +
                "2. Write a longer, detailed supportive story (around 120 words) in extremely simple, comforting English (about a sleepy dragon resting, floating clouds, warm cocoa, campfire sparks) so that the user feels relaxed.\n" +
                "Format the response exactly as a JSON object with two fields:\n" +
                "{\n" +
                "  \"quote\": \"[Encouraging short message]\",\n" +
                "  \"story\": \"[Cute simple story]\"\n" +
                "}",
                user.getNickname(),
                user.getDragonLevel().name(),
                completed,
                total,
                mood.name(),
                "continue".equalsIgnoreCase(path) ? "want to continue working" : "feel overwhelmed and need rest"
        );

        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + geminiApiKey;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        // Build the request body for Gemini API
        Map<String, Object> part = new HashMap<>();
        part.put("text", prompt);

        Map<String, Object> parts = new HashMap<>();
        parts.put("parts", List.of(part));

        Map<String, Object> contents = new HashMap<>();
        contents.put("contents", List.of(parts));

        // Request schema for JSON output
        Map<String, Object> responseConfig = new HashMap<>();
        responseConfig.put("responseMimeType", "application/json");
        contents.put("generationConfig", responseConfig);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(contents, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            // Extract the text content from the Gemini response structure
            List candidates = (List) response.getBody().get("candidates");
            if (candidates != null && !candidates.isEmpty()) {
                Map candidate = (Map) candidates.get(0);
                Map content = (Map) candidate.get("content");
                List partsList = (List) content.get("parts");
                if (partsList != null && !partsList.isEmpty()) {
                    Map partMap = (Map) partsList.get(0);
                    String text = (String) partMap.get("text");
                    
                    // Simple parse of JSON response
                    return parseJsonResponse(text);
                }
            }
        }

        throw new RuntimeException("Empty response from Gemini API");
    }

    private Map<String, String> parseJsonResponse(String jsonText) {
        Map<String, String> map = new HashMap<>();
        try {
            // Very simple JSON parse to avoid heavy parser dependencies
            String quoteKey = "\"quote\":";
            String storyKey = "\"story\":";
            
            int quoteIdx = jsonText.indexOf(quoteKey);
            int storyIdx = jsonText.indexOf(storyKey);

            if (quoteIdx != -1 && storyIdx != -1) {
                String quoteVal = extractValue(jsonText, quoteIdx + quoteKey.length());
                String storyVal = extractValue(jsonText, storyIdx + storyKey.length());
                map.put("quote", quoteVal);
                map.put("story", storyVal);
                return map;
            }
        } catch (Exception e) {
            System.err.println("Failed to parse Gemini JSON output: " + e.getMessage());
        }

        map.put("quote", "You are doing amazing things, one small step at a time!");
        map.put("story", "A small dragon took a gentle breath and lit up a tiny lantern to guide your way.");
        return map;
    }

    private String extractValue(String json, int startIdx) {
        int firstQuote = json.indexOf("\"", startIdx);
        if (firstQuote != -1) {
            int secondQuote = json.indexOf("\"", firstQuote + 1);
            if (secondQuote != -1) {
                return json.substring(firstQuote + 1, secondQuote);
            }
        }
        return "";
    }

    private Map<String, String> generateOffline(
            User user,
            Mood.MoodType mood,
            long completed,
            long total,
            String path
    ) {
        Map<String, String> output = new HashMap<>();
        Random rand = new Random();

        String quote;
        String story;

        String name = user.getNickname();
        String level = user.getDragonLevel().name();

        if ("continue".equalsIgnoreCase(path)) {
            // Energetic motivation path
            String[] energeticQuotes = {
                    "Superb speed, " + name + "! You are soaring through your tasks!",
                    "Unstoppable energy! Your " + level + " dragon is breathing sparks of joy!",
                    "Amazing progress! You're building incredible consistency!",
                    "Boom! Another victory checkmark! Keep that flame burning high!"
            };
            String[] energeticStories = {
                    "A cheerful little dragon named Sparky just did a mid-air loop de loop to celebrate your incredible speed!",
                    "Your " + level + " dragon spread its colorful wings and blew a soft puff of warm fire, igniting another star in the cozy task sky.",
                    "A balloon carrying a basket of happy chimes floated right past your window, dropping off a pocketful of magical focus dust!",
                    "Your dragon pet is doing a high-energy tap dance on a puffy marshmallow cloud, cheering for your next victory!"
            };

            quote = energeticQuotes[rand.nextInt(energeticQuotes.length)];
            story = energeticStories[rand.nextInt(energeticStories.length)];

        } else {
            // Overwhelmed rest path
            String[] supportiveQuotes = {
                    "Hey, take a deep breath. It's completely okay to step back. Rest is part of the work!",
                    "Your health and comfort are number one, " + name + ". Your dragon is waiting cozily for you.",
                    "No pressure at all! You completed " + completed + " tasks today, which is wonderful progress!",
                    "Small steps. You did great today. Let's fold up the wings and rest for a bit."
            };

            String[] calmingStories = {
                    "Once upon a time, in a quiet green forest, a little dragon decided it was time to rest. He folded his wings and found a soft bed made of green moss. The wind sang a soft song in the trees. The little dragon closed his eyes and breathed slow, warm bubbles. Each bubble glowed like a small star. He knew that rest is a very good thing. Tomorrow he would wake up strong and happy. For now, it was time to sleep and dream.",
                    "High up in the sky, a fluffy pink cloud saw that you worked hard today. The cloud gently floated down and wrapped your " + level + " dragon in a warm, cozy blanket. All the stars in the sky began to shine softly, turning into night-lights. The little dragon curled up and fell fast asleep. The world was quiet and safe. He whispers that you did an amazing job today. Now, it is time to close your eyes, take a deep breath, and let your mind rest.",
                    "Your dragon pet built a warm, glowing campfire using magical sparks. He invites you to sit down and relax. He brews a special sweet chamomile tea that smells like honey. The forest around you is peaceful, and a soft breeze blows. You do not have to think about tasks or goals anymore. Today, you did your very best, and that is more than enough. Let the warm sparks fill you with comfort. It is time to let go of any worries and rest.",
                    "A tiny baby dragon noticed you were feeling tired. He flew over with a soft cushion and a small cup of warm milk. He gently sat next to you, wrapping his warm tail around your feet. The dragon closed his eyes to show you how easy it is to rest. He breathes in peace and breathes out quiet joy. You did a wonderful job with " + completed + " goals today. Now, the dragon is sleeping, and he wants you to rest your beautiful mind too."
            };

            quote = supportiveQuotes[rand.nextInt(supportiveQuotes.length)];
            story = calmingStories[rand.nextInt(calmingStories.length)];
        }

        output.put("quote", quote);
        output.put("story", story);
        return output;
    }
}

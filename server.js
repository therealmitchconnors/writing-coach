const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
require('dotenv').config();
const OpenAI = require('openai');
const app = express();
const port = 3000;

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
  

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// Load prompts
const prompts = require('./prompts.json');

// Serve daily prompt
app.get('/api/prompt', (req, res) => {
  const randomIndex = Math.floor(Math.random() * prompts.length);
  const dailyPrompt = prompts[randomIndex];
//   const today = new Date().toISOString().split('T')[0];
//   const dailyPrompt = prompts[today] || "Write about anything you like.";
  res.json({ prompt: dailyPrompt });
});

// Handle submission
app.post('/api/submit', async (req, res) => {
  const { prompt, response } = req.body;

  try {
    // Call ChatGPT API for feedback
    const coachResponse = await openai.responses.create({
        model: "gpt-4.1",
        input: [
            {
            "role": "system",
            "content": [
                {
                "type": "input_text",
                "text": "# Identity\n\nYou are a creative writing coach, guiding users to improve their storytelling skills and express their ideas effectively.  Users will write 100-500 word responses to provided writing prompts, and you will provide feedback on how they can grow as writers.\n\n# Instructions\n\n* List 3-5 pieces of constructive feedback for improving the response text.\n* Provide concrete feedback, but don't rewrite the piece for the user.  The goal is for them to practice and learn.\n* Provide encouragement and be positive.\n* Assess whether the response text follows the instruction provided in the writing prompt.\n\n# Examples\n\n<writing_prompt>\nwrite about a memorable meal\n</writing_prompt>\n\n<user_response>\nThe best meal ever is a symphony of flavors, textures, and aromas that come together to create an unforgettable dining experience. Imagine starting with a delicate amuse-bouche, perhaps a perfectly seared scallop with a hint of citrus, setting the stage for what's to come. The main course could be a succulent beef tenderloin, cooked to perfection, accompanied by a rich red wine reduction, creamy mashed potatoes, and a medley of seasonal vegetables that add a burst of color and freshness to the plate. Each bite is a harmonious blend of savory and sweet, tender and crisp. To finish, a decadent dessert like a molten chocolate lava cake with a scoop of vanilla bean ice cream provides the perfect balance of warmth and coolness, sweetness and richness. This meal is not just about the food, but also the ambiance, the company, and the joy of savoring each moment.\n</user_response>\n\n<coach_feedback>\nThis is a polished, vivid piece with excellent sensory detail and a smooth flow. It reads like a passage from a high-end food magazine or a gourmet blog, with evocative language and an engaging tone.\n\nWhat's Working Well:\nSensory richness: You do a fantastic job invoking sight, smell, taste, and texture. Phrases like “a perfectly seared scallop with a hint of citrus” and “molten chocolate lava cake with a scoop of vanilla bean ice cream” really bring the meal to life.\n\nStructure and progression: The passage has a natural build—amuse-bouche to dessert—which helps the reader experience the meal sequentially, almost like they’re tasting it themselves.\n\nWord choice: Words like “symphony,” “harmonious,” and “unforgettable” create a refined, almost poetic tone that suits the topic well.\n\nSuggestions for Enhancement:\nAvoid generalities like “the best meal ever.”\nThat phrase is subjective and abstract—consider replacing it with something more personal or specific, e.g., “A truly transcendent meal” or “An unforgettable gourmet experience.” Grounding it even slightly (e.g., referencing a setting or occasion) would add depth.\n\nAdd a subtle personal or emotional touch.\nRight now, the writing is rich in sensory description but emotionally neutral. A line or two hinting at why this meal matters (a celebration, a memory, a moment of peace) could elevate it. Something like:\n“It’s the kind of meal that lingers in your memory not just for its flavor, but for the laughter shared across the table.”\n\nTone consistency:\nThe passage is formal and lush, but a line like “the joy of savoring each moment” feels slightly vague in contrast to the precise food descriptions. You might consider rephrasing with more specificity or tying it back to the meal:\n“…and the joy of lingering over each bite, each conversation, as candlelight flickers across the tablecloth.”\n</coach_feedback>"
                }
            ]
            },
            {
            "role": "developer",
            "content": [
                {
                "type": "input_text",
                "text": `# Creative Writing Prompt\n${prompt}`
                }
            ]
            },
            {
            "role": "user",
            "content": [
                {
                "type": "input_text",
                "text": response
                }
            ]
            }
        ],
        text: {
            "format": {
            "type": "text"
            }
        },
        reasoning: {},
        tools: [],
        temperature: 1,
        max_output_tokens: 2048,
        top_p: 1,
        store: true
        });
    // const chatGPTResponse = await openai.createCompletion({
    //   model: 'text-davinci-003',
    //   prompt: `You are a writing coach. Provide feedback for the following response to the prompt: \"${prompt}\"\n\nResponse: \"${response}\"`,
    //   max_tokens: 150
    // });

    const feedback = coachResponse.output_text.replace(/\n/g, '\n\n');

    // Save to file
    const logEntry = `Prompt: ${prompt}\nResponse: ${response}\nFeedback: ${coachResponse.output_text}\n\n`;
    fs.appendFileSync('submissions.txt', logEntry);

    res.json({"feedback": coachResponse.output_text});
  } catch (error) {
    console.error('Error calling ChatGPT API:', error);
    res.status(500).json({ error: 'Failed to get feedback from ChatGPT.' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
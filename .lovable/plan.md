

Looking at the screenshot, the SuggestionPrompt UI shows numbered options (1-4) with hint text "↑↓ navigate · Enter select · Esc dismiss · Or type your own answer below". This implies typing the number should select the corresponding option, but currently typing "4" sends the literal string "4" to the AI, which then can't map it back.

Let me check how SuggestionPrompt and AIChatPanel handle keyboard input.

import { Plugin, Editor } from 'obsidian';

export default class VocabularyPlugin extends Plugin {
  async onload() {
    console.log("Vocabulary plugin loaded");

    // Registering the command with a hotkey
    this.addCommand({
      id: 'translate-word',
      name: 'Translate and add to Vocabulary',
      hotkeys: [{ modifiers: ['Ctrl'], key: 'T' }],
      editorCallback: async (editor: Editor) => {
        const selectedText = editor.getSelection().trim(); // Trimming whitespace from the selected text

        // Check if any text is selected
        if (!selectedText || selectedText.length === 0) {
          console.log("No text selected or selection is empty.");
          return;
        }

        console.log("Selected text:", selectedText);

        // Validate if the selected text is English
        if (!this.isEnglishText(selectedText)) {
          console.log("Not an English text.");
          return;
        }

        // Perform the translation
        const translation = await this.translateText(selectedText);

        // Get the cursor positions
        let cursorStart = editor.listSelections()[0].anchor;
        let cursorEnd = editor.listSelections()[0].head;

        console.log("Original Cursor start:", cursorStart, "Cursor end:", cursorEnd);

        // Correct the cursor order if needed
        if (cursorStart.line > cursorEnd.line || (cursorStart.line === cursorEnd.line && cursorStart.ch > cursorEnd.ch)) {
          [cursorStart, cursorEnd] = [cursorEnd, cursorStart];
        }

        console.log("Corrected Cursor start:", cursorStart, "Cursor end:", cursorEnd);

        const markedWord = `==${selectedText}==`;

        // Replace the selected text with the marked word
        editor.replaceRange(markedWord, cursorStart, cursorEnd);

        // Set the cursor to the end of the marked word after replacement
        editor.setCursor(cursorEnd.line, cursorEnd.ch + markedWord.length - selectedText.length);

        // Add the word and its translation to the dictionary section
        this.addWordToVocabulary(editor, selectedText, translation);
      }
    });
  }

  // Check if the text is in English
  isEnglishText(text: string): boolean {
    // Regular expression to verify if the text contains English letters
    const englishRegex = /^[a-zA-Z\s.,!?'-]+$/;
    return englishRegex.test(text.trim());
  }

  async onunload() {
    console.log("Vocabulary plugin unloaded");
  }

  // Translate the text from English to Russian
  async translateText(text: string): Promise<string> {
    const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ru&dt=t&q=${encodeURIComponent(text)}`);
    const result = await response.json();

    // Combine translated parts into a single string
    const translatedText = result[0].map((item: [string]) => item[0]).join('');
    return translatedText;
  }

  // Add the word and its translation to the dictionary section in the editor
  addWordToVocabulary(editor: Editor, word: string, translation: string) {
    const docContent = editor.getValue();
    const vocabularyHeader = "### Vocabulary";
    const vocabularyEntry = `${word} - ${translation}`;

    // Check if the document contains the dictionary header
    if (docContent.includes(vocabularyHeader)) {
      // Add the new entry under the dictionary header
      const updatedContent = docContent.replace(vocabularyHeader, `${vocabularyHeader}\n${vocabularyEntry}`);
      editor.setValue(updatedContent);
    } else {
      // Add a new dictionary section at the top of the document
      const updatedContent = `### Vocabulary\n${vocabularyEntry}\n${docContent}`;
      editor.setValue(updatedContent);
    }
  }
}

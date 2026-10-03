# English Speaking Practice App — PRD

## 1. What — One-Line Definition

The English Speaking Practice App is a web app for Korean-speaking learners who study with English audio/scripts. It organizes sentences into folders and supports repeated practice through the following flow:

**Listen (TTS) → Hide → Speak (STT) → Record Proficiency**

The app is designed for learners who already have sentence-level English study materials prepared outside the app.

---

## 2. Main User Scenarios

### 1. Preparing sentences

The user creates a folder and adds practice sentences either by uploading a CSV file or by entering sentences manually one at a time.

### 2. Practicing sentences

The user listens to the English pronunciation using TTS, hides the English text, and tries to speak the English sentence while looking at the Korean translation.

The app converts the user's speech to text using STT. The user compares the recognized speech with the original sentence manually, records their proficiency level, and moves on to the next sentence.

### 3. Reviewing sentences

The user filters sentences within a folder by proficiency level, such as **Completely Unfamiliar**, and practices only the sentences that match the selected levels.

---

## 3. Who — Target User

### Persona

Korean-speaking English learners who study with English audio/scripts and want to practice producing sentences aloud rather than only reading them.

The user already has sentence-level study materials prepared outside the app.

### Core Pain Point

Reading an English script does not make it easy to determine whether the learner can actually produce the sentence.

There is a need for a simple tool that allows learners to hide the sentence, speak it from memory, and immediately review what they said.

### Definition of Success

The user can clearly see sentences progress from **Completely Unfamiliar** to **In Progress** and eventually to **Acquired**, while continuing practice at the folder level.

---

# 4. Behavior — Screen Specifications

## Overall Screen Structure

The app starts on the **Practice Screen**.

The **Folder Panel** and **Add Sentences Panel** open as overlays on top of the Practice Screen.

The Practice Screen provides a button to navigate to the **Sentence Table Screen**.

### Separation of Responsibilities

- **Practice Screen**: Focus on practicing one sentence at a time.
- **Sentence Table Screen**: View and manage all sentences in a folder at once.

---

## 4.1 Practice Screen

**URL:** `/folders/:folderId`

### Entry Conditions

When the app is opened:

- If folders exist, the first-created folder is automatically selected.
- Practice starts from the first sentence in that folder.
- If no folders exist, the Folder Panel automatically opens and prompts the user to create a folder.

### UI Elements

#### Top Bar

- **Current Folder Name** button → Opens the Folder Panel.
- **View Sentence Table** button → Navigates to the Sentence Table Screen.

#### Left Side

- **+** button → Opens the Add Sentences Panel.

#### Column Header

Columns:

1. Number
2. English
3. Korean
4. My Speech
5. Proficiency

The column headers provide the following controls:

- **English** column → Show/Hide toggle.
- **Korean** column → Show/Hide toggle.
- **Proficiency** column → Three filter checkboxes:
  - Completely Unfamiliar
  - In Progress
  - Acquired

All three proficiency levels are selected by default.

When a column is hidden, only its content is hidden. The column itself remains in place so that the layout does not shift.

### Sentence Dial

The main content is displayed as a dial-like sentence list.

- The **center row** represents the current sentence.
- The center row is highlighted as a card with bold text and a border.
- The row immediately above and below the center row are also displayed in their complete form, but with less emphasis.
- Additional rows above and below are displayed in a smaller and more faded form.
- The farther a row is from the center, the smaller its scale and opacity become.
- Approximately 1–2 additional rows are shown on each side.
- Only sentences that pass the active proficiency filter are included in the dial.
- The displayed sentence number always preserves its original position within the folder.
- Clicking a non-center row moves that sentence to the center.

### Navigation

On the right side:

- **Up** button = Previous sentence
- **Down** button = Next sentence

The user can also navigate using the mouse wheel.

A circular/rotating scrollbar-style UI is out of scope for v1.

### Center Row Interactions

Only the center row supports active interactions. Other rows are read-only and can only be clicked to move them to the center.

#### English Cell

- **Listen** button
- Uses the browser's built-in Text-to-Speech API.
- TTS remains available even when the English column is hidden.

#### My Speech Cell

- Microphone button
- Text input field

#### Proficiency Cell

- Proficiency badge

---

## User Actions

### Listen

Clicking **Listen** plays the English sentence using browser-native TTS.

### Speak

Clicking the microphone:

1. Starts speech recognition.
2. Changes the microphone button to a recording/recognition state.
3. Displays the recognized speech in the input field when available.
4. Clicking the button again stops recognition.

Whether the recognized text can be displayed in real time depends on the browser's built-in STT implementation.

If real-time transcription is not available, the result is displayed after recognition ends.

### Manual Input

The user can type directly into the My Speech input field.

The input field represents the sentence's latest speech result (`last_transcript`).

Only the most recent speech result is stored. A new result overwrites the previous one.

The value is saved:

- when speech recognition ends, or
- when the user leaves the input field after typing.

### Speech Comparison

The app does not automatically compare the user's speech with the original sentence.

The user visually compares the two.

### Proficiency

Clicking the proficiency badge cycles through:

**Completely Unfamiliar → In Progress → Acquired → Completely Unfamiliar**

The change is saved immediately.

Whether this should be implemented as a dropdown instead of a cycling badge can be proposed during the implementation plan.

### Up / Down Navigation

Clicking **Up** or **Down** moves to the nearest sentence that passes the current proficiency filter.

- **Up**: nearest sentence with a smaller position number.
- **Down**: nearest sentence with a larger position number.

### Column Visibility

The English and Korean columns can be independently shown or hidden.

The visibility state remains while navigating between sentences.

The visibility state is initialized with both columns visible when entering the screen and is not persisted after a page refresh.

### Proficiency Filter

Changing the proficiency checkboxes immediately updates the dial.

If the current sentence no longer matches the selected filter, the current sentence remains centered until the user navigates using **Up** or **Down**.

---

## Exceptions and Edge Cases

### No Folders

If no folders exist:

> Please create a folder.

The Folder Panel should be available directly from this empty state.

### Folder Has No Sentences

Display:

> No sentences. Add sentences using the + button.

### No Sentences Match the Filter

Display:

> No sentences match the selected conditions.

### Current Sentence Becomes Filtered Out

If changing proficiency causes the current sentence to no longer match the filter, keep it as the center sentence until the user navigates.

The next **Up** or **Down** action follows the filtered navigation rules.

### Circular Navigation

The sentence list wraps around:

- Pressing **Up** on the first sentence moves to the last sentence.
- Pressing **Down** on the last sentence moves to the first sentence.

When filters are active, navigation should still follow the currently filtered sentence set.

### STT Not Supported

If the browser does not support the required STT functionality:

- Disable the microphone button.
- Display an explanatory message.
- Keep manual text input available.

Browser support should be investigated during implementation. The app uses browser-native functionality only.

### Microphone Permission Denied

Display an explanatory message.

### No Recognition Result / Recognition Failure

Display an explanatory message.

The existing `last_transcript` must not be overwritten.

### TTS Not Supported / Playback Failure

Display an explanatory message.

### Empty English or Korean Text

If `en` is empty:

- Disable the **Listen** button.

If either `en` or `ko` is empty:

- Display `(none)` in the corresponding cell.

---

## 4.2 Folder Panel

### Entry Conditions

The Folder Panel opens when the user clicks the current folder name in the top bar.

It also opens automatically when no folders exist.

### UI Elements

The Folder Panel appears over the Practice Screen as either:

- a sliding side panel, or
- an overlay.

The exact presentation can be proposed in the implementation plan.

Contents:

- New folder name input
- **Create** button
- Folder list
  - Folder name
  - Number of sentences
  - **Delete** button
- **Close** button

### User Actions

#### Select Folder

Clicking a folder:

- Makes it the current folder.
- Closes the panel.
- Opens the selected folder on its first sentence.

#### Create Folder

Before creating a folder:

- Trim leading and trailing whitespace from the name.
- Add the folder to the folder list.

#### Delete Folder

Deleting a folder requires confirmation.

The folder and all sentences inside it are deleted together.

If the deleted folder was the current folder:

- Switch to the first-created remaining folder.
- If no folders remain, show the empty state.

### Exceptions

#### Empty Folder Name

Do not create the folder.

Display an explanatory message.

#### Duplicate Folder Name

Do not create the folder.

Display:

> A folder with this name already exists.

---

## 4.3 Add Sentences Panel

The Add Sentences Panel is shared by the Practice Screen and Sentence Table Screen.

### Entry Conditions

The panel opens when the user clicks the **+** button.

The Sentence Table Screen also provides the same **+** button.

### UI Elements

The panel can be implemented as a small panel or modal.

#### Input Method

The user selects one of:

- **Add from File**
- **Manual Input**

#### Common

- Target folder selector
- Defaults to the current folder

#### Add from File

- CSV file picker
- Format guidance:

> Please upload a UTF-8 encoded CSV file.

#### Manual Input

- English sentence input
- Korean translation input
- **Add** button

### User Actions

#### Manual Input

Add the sentence to the end of the selected folder.

Either `en` or `ko` may be empty, but both cannot be empty.

#### CSV Upload

Append the imported sentences to the end of the selected folder.

Duplicate English sentences are allowed.

### CSV Format

Required columns:

```text
id,en,ko,transcript
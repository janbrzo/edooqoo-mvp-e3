
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

interface BlogPost {
  title: string;
  description: string;
  href: string;
  category: string;
  date: string;
}

const blogPosts: BlogPost[] = [
  { title: "How to Create Grammar Worksheets with AI in 2026", description: "Step-by-step guide with best grammar topics by CEFR level and tips for effective practice.", href: "/blog/how-to-create-grammar-worksheets-with-ai.html", category: "Worksheet Creation", date: "March 11, 2026" },
  { title: "10 Vocabulary Teaching Strategies for ESL Teachers", description: "Proven strategies with AI worksheet examples for contextual learning and spaced repetition.", href: "/blog/vocabulary-teaching-strategies-esl.html", category: "Worksheet Creation", date: "March 11, 2026" },
  { title: "15 Reading Comprehension Activities for English Classes", description: "Activities from A1 to C2 with practical implementation tips.", href: "/blog/reading-comprehension-activities-english.html", category: "Worksheet Creation", date: "March 11, 2026" },
  { title: "Fill in the Blanks Exercises — Best Practices", description: "Types of gap-fill, creating effective distractors, and grading strategies.", href: "/blog/fill-in-the-blanks-exercises-best-practices.html", category: "Worksheet Creation", date: "March 11, 2026" },
  { title: "Differentiated Instruction in the English Classroom", description: "6 strategies for ESL/EFL with AI personalization examples.", href: "/blog/differentiated-instruction-english-classroom.html", category: "Teaching Methods", date: "March 11, 2026" },
  { title: "How to Assess English Level Using CEFR", description: "Complete teacher's guide with can-do statements and placement testing.", href: "/blog/how-to-assess-english-level-cefr.html", category: "Teaching Methods", date: "March 11, 2026" },
  { title: "Teaching English Online in 2026 — Complete Guide", description: "Setup, tools, engagement, scheduling, and growing your online tutoring business.", href: "/blog/teaching-english-online-complete-guide.html", category: "Teaching Methods", date: "March 11, 2026" },
  { title: "Spaced Repetition for Vocabulary Learning", description: "The science behind SM-2 algorithm and practical implementation for ESL.", href: "/blog/spaced-repetition-vocabulary-learning.html", category: "Teaching Methods", date: "March 11, 2026" },
  { title: "Best AI Tools for English Teachers in 2026", description: "Complete comparison of Edooqoo, ChatGPT, Twee, MagicSchool, and more.", href: "/blog/ai-tools-for-english-teachers-2026.html", category: "AI in Education", date: "March 11, 2026" },
  { title: "AI Homework Grading for English Teachers", description: "How AI grading works and saves hours every week.", href: "/blog/ai-homework-grading-for-english-teachers.html", category: "AI in Education", date: "March 11, 2026" },
  { title: "AI-Generated Listening Exercises for ESL", description: "How text-to-speech technology changes language teaching.", href: "/blog/ai-generated-listening-exercises-esl.html", category: "AI in Education", date: "March 11, 2026" },
  { title: "Personalized Learning in English Teaching", description: "From theory to AI-powered practice with nano-skill tracking.", href: "/blog/personalized-learning-english-teaching.html", category: "AI in Education", date: "March 11, 2026" },
  { title: "Cambridge Exam Preparation Tips for Teachers", description: "Worksheet strategies for KET, PET, FCE, CAE, and CPE.", href: "/blog/cambridge-exam-preparation-tips-teachers.html", category: "Exam & Business", date: "March 11, 2026" },
  { title: "Teaching Business English — Complete Guide", description: "Key topics, industry vocabulary, role-play activities, and pricing.", href: "/blog/teaching-business-english-guide.html", category: "Exam & Business", date: "March 11, 2026" },
  { title: "IELTS Preparation Worksheets Guide", description: "Effective practice materials for all four IELTS sections.", href: "/blog/ielts-preparation-worksheets-guide.html", category: "Exam & Business", date: "March 11, 2026" },
  { title: "Communicative Language Teaching Activities for ESL", description: "Information gap, role-play, opinion exchange, and task-based CLT activities.", href: "/blog/communicative-language-teaching-activities.html", category: "Methodology", date: "March 16, 2026" },
  { title: "Task-Based Language Teaching Worksheets", description: "Pre-task, task cycle, and language focus phases with TBLT worksheet examples.", href: "/blog/task-based-language-teaching-worksheets.html", category: "Methodology", date: "March 16, 2026" },
  { title: "Flipped Classroom for English Teaching", description: "Pre-class worksheets and in-class communicative activities for ESL.", href: "/blog/flipped-classroom-english-teaching.html", category: "Methodology", date: "March 16, 2026" },
  { title: "Gamification in the English Classroom", description: "Points, badges, quests, and game-based activities for ESL/EFL classes.", href: "/blog/gamification-english-classroom.html", category: "Methodology", date: "March 16, 2026" },
  { title: "Scaffolding Strategies for English Learners", description: "10 scaffolding strategies with AI-differentiated worksheet examples.", href: "/blog/scaffolding-strategies-english-learners.html", category: "Methodology", date: "March 16, 2026" },
  { title: "Formative Assessment in English Teaching", description: "Exit tickets, self-assessment, peer feedback, and AI-graded homework strategies.", href: "/blog/formative-assessment-english-teaching.html", category: "Methodology", date: "March 16, 2026" },
  { title: "How to Teach English Grammar Effectively", description: "Proven grammar teaching strategies with inductive and deductive approaches.", href: "/blog/how-to-teach-english-grammar-effectively.html", category: "How to Teach", date: "March 17, 2026" },
  { title: "How to Teach Speaking in ESL Classes", description: "Fluency vs accuracy, discussion frameworks, and role-play techniques.", href: "/blog/how-to-teach-speaking-esl.html", category: "How to Teach", date: "March 17, 2026" },
  { title: "How to Teach Writing to ESL Students", description: "Process writing, genre-based approach, and effective feedback strategies.", href: "/blog/how-to-teach-writing-esl-students.html", category: "How to Teach", date: "March 17, 2026" },
  { title: "How to Teach English Pronunciation", description: "Minimal pairs, connected speech, stress and intonation techniques.", href: "/blog/how-to-teach-english-pronunciation.html", category: "How to Teach", date: "March 17, 2026" },
  { title: "How to Plan English Lessons Effectively", description: "PPP, ESA, TBL frameworks with lesson plan templates and timing.", href: "/blog/how-to-plan-english-lessons-effectively.html", category: "How to Teach", date: "March 17, 2026" },
  { title: "Classroom Management Tips for ESL Teachers", description: "Engagement techniques, behavior management, and motivation strategies.", href: "/blog/classroom-management-esl-tips.html", category: "How to Teach", date: "March 17, 2026" },
  // Phase 9: Young Learners
  { title: "Teaching English to Young Learners — Complete Guide", description: "Age-appropriate methods, TPR, songs, games, and classroom management for kids.", href: "/blog/teaching-english-to-young-learners.html", category: "Young Learners", date: "March 18, 2026" },
  { title: "20 ESL Games for Kids That Actually Work", description: "Tested classroom games for vocabulary, grammar, and speaking practice with young learners.", href: "/blog/esl-games-for-kids.html", category: "Young Learners", date: "March 18, 2026" },
  { title: "Teaching English to Teenagers — Strategies That Work", description: "Motivation, relevant topics, technology integration, and managing teenage dynamics.", href: "/blog/teaching-english-to-teenagers.html", category: "Young Learners", date: "March 18, 2026" },
  { title: "Using Songs and Music in the ESL Classroom", description: "Song-based activities for grammar, vocabulary, pronunciation, and listening skills.", href: "/blog/english-songs-activities-esl.html", category: "Young Learners", date: "March 18, 2026" },
  { title: "Storytelling Activities for ESL Classes", description: "Story-based lessons for reading, speaking, writing, and creative thinking.", href: "/blog/storytelling-activities-esl.html", category: "Young Learners", date: "March 18, 2026" },
  // Phase 9: Vocabulary
  { title: "How to Teach Collocations in ESL Classes", description: "Collocation types, teaching strategies, and practice activities for natural English.", href: "/blog/teaching-collocations-esl.html", category: "Vocabulary", date: "March 18, 2026" },
  { title: "Teaching Idioms — Activities and Worksheets for ESL", description: "Context-based idiom teaching with categorized activities by CEFR level.", href: "/blog/teaching-idioms-esl-activities.html", category: "Vocabulary", date: "March 18, 2026" },
  { title: "15 Vocabulary Games for the ESL Classroom", description: "Engaging games for vocabulary review, acquisition, and retention.", href: "/blog/vocabulary-games-esl-classroom.html", category: "Vocabulary", date: "March 18, 2026" },
  { title: "Teaching Academic Vocabulary — Strategies for ESL", description: "AWL-based instruction, Tier 2-3 words, and academic register practice.", href: "/blog/academic-vocabulary-teaching-strategies.html", category: "Vocabulary", date: "March 18, 2026" },
  { title: "Word Formation Exercises — Prefixes, Suffixes, and Roots", description: "Morphology-based vocabulary building with exercises and worksheets.", href: "/blog/word-formation-exercises-english.html", category: "Vocabulary", date: "March 18, 2026" },
  // Phase 9: Grammar
  { title: "Teaching Conditionals — Complete ESL Guide", description: "Zero to third conditional with timelines, practice activities, and common errors.", href: "/blog/teaching-conditionals-esl-guide.html", category: "Grammar", date: "March 18, 2026" },
  { title: "Teaching Passive Voice — Activities and Worksheets", description: "When and how to introduce passive voice with engaging transformation activities.", href: "/blog/teaching-passive-voice-activities.html", category: "Grammar", date: "March 18, 2026" },
  { title: "Teaching Reported Speech — Step-by-Step Guide", description: "Tense backshift rules, reporting verbs, and communicative practice activities.", href: "/blog/teaching-reported-speech-esl.html", category: "Grammar", date: "March 18, 2026" },
  { title: "Teaching Articles (A, An, The) — ESL Guide", description: "Rules, exceptions, and practice activities for English articles.", href: "/blog/teaching-articles-esl-guide.html", category: "Grammar", date: "March 18, 2026" },
  { title: "Error Correction Techniques for ESL Teachers", description: "Self-correction, peer correction, delayed correction, and reformulation strategies.", href: "/blog/error-correction-techniques-esl.html", category: "Grammar", date: "March 18, 2026" },
  // Phase 9: Assessment
  { title: "How to Create Effective English Tests — Teacher's Guide", description: "Test design principles, item types, scoring, and validity for English assessment.", href: "/blog/creating-english-tests-guide.html", category: "Assessment", date: "March 18, 2026" },
  { title: "Creating Rubrics for English Language Assessment", description: "Analytic and holistic rubrics for writing, speaking, and project assessment.", href: "/blog/rubrics-for-english-teachers.html", category: "Assessment", date: "March 18, 2026" },
  { title: "Self-Assessment Strategies for ESL Students", description: "Can-do checklists, learning journals, and portfolio-based self-evaluation.", href: "/blog/self-assessment-strategies-esl.html", category: "Assessment", date: "March 18, 2026" },
  { title: "Peer Feedback Activities for English Classes", description: "Structured peer review, feedback frames, and collaborative assessment techniques.", href: "/blog/peer-feedback-activities-english.html", category: "Assessment", date: "March 18, 2026" },
  { title: "Diagnostic Testing for English Learners — How and When", description: "Placement tests, needs analysis, and identifying learning gaps.", href: "/blog/diagnostic-testing-english-learners.html", category: "Assessment", date: "March 18, 2026" },
  // Phase 9: Activities
  { title: "20 Warm-Up Activities for ESL Classes", description: "Quick 5-minute activities to start every lesson with energy and focus.", href: "/blog/warm-up-activities-esl.html", category: "Activities", date: "March 18, 2026" },
  { title: "Role-Play Activities for ESL — Ideas and Templates", description: "Scenario cards, role assignments, and language support for speaking practice.", href: "/blog/role-play-activities-esl.html", category: "Activities", date: "March 18, 2026" },
  { title: "Debate Activities for English Classes — Topics and Rules", description: "Structured debate formats, topic lists by level, and language of argumentation.", href: "/blog/debate-activities-english-class.html", category: "Activities", date: "March 18, 2026" },
  { title: "Pair Work Activities for ESL — 15 Ready-to-Use Ideas", description: "Information gap, interview, survey, and collaborative pair activities.", href: "/blog/pair-work-activities-esl.html", category: "Activities", date: "March 18, 2026" },
  { title: "Project-Based Learning in the English Classroom", description: "Long-term projects integrating all four skills with assessment criteria.", href: "/blog/project-based-learning-english.html", category: "Activities", date: "March 18, 2026" },
  // Phase 9: Professional Dev
  { title: "TEFL Certification — Complete Guide for New Teachers", description: "TEFL vs TESOL vs CELTA, online vs in-person, costs, and career paths.", href: "/blog/tefl-certification-guide.html", category: "Professional Dev", date: "March 18, 2026" },
  { title: "Preventing Teacher Burnout — Strategies for ESL Teachers", description: "Workload management, boundaries, self-care, and sustainable teaching practices.", href: "/blog/teacher-burnout-prevention-esl.html", category: "Professional Dev", date: "March 18, 2026" },
  { title: "Building Your ESL Teaching Portfolio — What to Include", description: "Portfolio structure, sample materials, student testimonials, and digital tools.", href: "/blog/building-esl-teaching-portfolio.html", category: "Professional Dev", date: "March 18, 2026" },
  { title: "Using AI to Boost Teacher Productivity in 2026", description: "AI tools for lesson planning, worksheet creation, grading, and admin tasks.", href: "/blog/using-ai-teacher-productivity.html", category: "Professional Dev", date: "March 18, 2026" },
  { title: "Setting Up a Freelance ESL Business — Complete Guide", description: "Pricing, marketing, student acquisition, tools, and scaling strategies.", href: "/blog/setting-up-freelance-esl-business.html", category: "Professional Dev", date: "March 18, 2026" },
  // Phase 10: Culture
  { title: "Teaching Culture in the ESL Classroom", description: "Integrating cultural awareness, intercultural competence, and global citizenship.", href: "/blog/teaching-culture-esl-classroom.html", category: "Culture", date: "March 19, 2026" },
  { title: "Cross-Cultural Communication Activities for ESL", description: "Activities exploring cultural norms, body language, and communication styles.", href: "/blog/cross-cultural-communication-activities.html", category: "Culture", date: "March 19, 2026" },
  { title: "Using Films and Videos in English Teaching", description: "Film-based lessons, clip selection, viewing tasks, and discussion activities.", href: "/blog/using-films-english-teaching.html", category: "Culture", date: "March 19, 2026" },
  { title: "Teaching English Through Literature — Practical Guide", description: "Graded readers, poetry, short stories, and literature circles for ESL.", href: "/blog/teaching-english-through-literature.html", category: "Culture", date: "March 19, 2026" },
  { title: "Using Current Events in ESL Lessons", description: "News-based lessons, media literacy, and critical thinking activities.", href: "/blog/current-events-esl-lessons.html", category: "Culture", date: "March 19, 2026" },
  // Phase 10: Technology
  { title: "Best Apps for Learning English in 2026", description: "App comparison for vocabulary, grammar, speaking, and listening practice.", href: "/blog/best-apps-learning-english-2026.html", category: "Technology", date: "March 19, 2026" },
  { title: "Using Google Workspace for ESL Teachers", description: "Google Docs, Slides, Forms, and Classroom for English teaching workflows.", href: "/blog/using-google-workspace-esl-teachers.html", category: "Technology", date: "March 19, 2026" },
  { title: "Creating Interactive Worksheets Online — Tools and Tips", description: "Platforms and techniques for making engaging digital worksheets.", href: "/blog/creating-interactive-worksheets-online.html", category: "Technology", date: "March 19, 2026" },
  { title: "Video Conferencing Tips for Online ESL Teachers", description: "Zoom, Meet, and Teams optimization for effective online English lessons.", href: "/blog/video-conferencing-tips-online-esl.html", category: "Technology", date: "March 19, 2026" },
  { title: "AI Lesson Planning Strategies for English Teachers", description: "Using AI to plan, differentiate, and optimize English lessons.", href: "/blog/ai-lesson-planning-strategies.html", category: "Technology", date: "March 19, 2026" },
  // Phase 10: Specialized
  { title: "Teaching English to Immigrants and Refugees", description: "Trauma-informed teaching, survival English, and community integration.", href: "/blog/teaching-english-immigrants-refugees.html", category: "Specialized", date: "March 19, 2026" },
  { title: "English for Specific Purposes (ESP) — Teacher's Guide", description: "Medical, legal, aviation, and technical English course design.", href: "/blog/english-for-specific-purposes-guide.html", category: "Specialized", date: "March 19, 2026" },
  { title: "Teaching English to Students with Learning Disabilities", description: "Dyslexia-friendly materials, ADHD strategies, and inclusive classroom design.", href: "/blog/teaching-english-learning-disabilities.html", category: "Specialized", date: "March 19, 2026" },
  { title: "Managing a Multilevel ESL Classroom", description: "Differentiation strategies, tiered tasks, and flexible grouping techniques.", href: "/blog/multilevel-esl-classroom-strategies.html", category: "Specialized", date: "March 19, 2026" },
  { title: "Teaching English One-to-One — Private Lesson Guide", description: "Needs analysis, lesson structure, pacing, and building rapport in private lessons.", href: "/blog/teaching-english-one-to-one.html", category: "Specialized", date: "March 19, 2026" },
  // Phase 10: Writing & Comm
  { title: "Teaching Email Writing to ESL Students", description: "Formal and informal email templates, register, and common mistakes.", href: "/blog/teaching-email-writing-esl.html", category: "Writing & Comm", date: "March 19, 2026" },
  { title: "Creative Writing Activities for ESL Classes", description: "Story starters, poetry, flash fiction, and collaborative writing projects.", href: "/blog/creative-writing-activities-esl.html", category: "Writing & Comm", date: "March 19, 2026" },
  { title: "Teaching Presentation Skills in English", description: "Structure, signposting language, visual aids, and delivery techniques.", href: "/blog/teaching-presentation-skills-english.html", category: "Writing & Comm", date: "March 19, 2026" },
  { title: "100 Discussion Questions for ESL Classes — By Topic", description: "Curated questions organized by topic and CEFR level for speaking practice.", href: "/blog/discussion-questions-esl-topics.html", category: "Writing & Comm", date: "March 19, 2026" },
  { title: "Teaching Formal vs Informal English — Register Guide", description: "Register awareness, academic vs conversational English, and style shifting.", href: "/blog/teaching-formal-informal-english.html", category: "Writing & Comm", date: "March 19, 2026" },
  // Phase 10: Lesson Resources
  { title: "First Day of ESL Class — Activities and Icebreakers", description: "Needs analysis, icebreakers, classroom rules, and first-lesson routines.", href: "/blog/first-day-esl-class-activities.html", category: "Lesson Resources", date: "March 19, 2026" },
  { title: "End-of-Term Activities for ESL Classes", description: "Review games, portfolio presentations, reflection activities, and celebrations.", href: "/blog/end-of-term-activities-esl.html", category: "Lesson Resources", date: "March 19, 2026" },
  { title: "Holiday-Themed ESL Activities and Worksheets", description: "Christmas, Halloween, Easter, and cultural holiday lesson ideas.", href: "/blog/holiday-themed-esl-activities.html", category: "Lesson Resources", date: "March 19, 2026" },
  { title: "Substitute Teacher ESL Lesson Plans — Ready to Go", description: "No-prep emergency lesson plans for substitute ESL teachers.", href: "/blog/substitute-teacher-esl-lesson-plans.html", category: "Lesson Resources", date: "March 19, 2026" },
  { title: "20 Five-Minute Filler Activities for ESL", description: "Quick activities for transitions, early finishers, and unexpected free time.", href: "/blog/five-minute-filler-activities-esl.html", category: "Lesson Resources", date: "March 19, 2026" },
  // Phase 10: Language Systems
  { title: "Teaching Linking Words and Connectors", description: "Conjunctions, discourse markers, and cohesion activities by CEFR level.", href: "/blog/teaching-linking-words-connectors.html", category: "Language Systems", date: "March 19, 2026" },
  { title: "Using Corpus Linguistics in ESL Teaching", description: "Concordancers, frequency lists, and data-driven learning activities.", href: "/blog/corpus-linguistics-esl-teaching.html", category: "Language Systems", date: "March 19, 2026" },
  { title: "Contrastive Analysis in Language Teaching", description: "L1 interference patterns, error prediction, and targeted practice strategies.", href: "/blog/contrastive-analysis-language-teaching.html", category: "Language Systems", date: "March 19, 2026" },
  { title: "Teaching Pragmatics in ESL — Politeness and Context", description: "Speech acts, politeness strategies, and context-appropriate language use.", href: "/blog/teaching-pragmatics-esl.html", category: "Language Systems", date: "March 19, 2026" },
  { title: "Setting Up Extensive Reading Programs for ESL", description: "Graded readers, reading logs, assessment, and motivation strategies.", href: "/blog/extensive-reading-programs-esl.html", category: "Language Systems", date: "March 19, 2026" },
  // Phase 11: Pronunciation & Phonology
  { title: "Teaching Minimal Pairs — Pronunciation Activities for ESL", description: "Minimal pair drills, card games, and listening discrimination exercises.", href: "/blog/teaching-minimal-pairs-esl.html", category: "Pronunciation", date: "March 21, 2026" },
  { title: "Teaching English Intonation and Stress Patterns", description: "Sentence stress, word stress, rising/falling intonation with practice activities.", href: "/blog/teaching-english-intonation-stress.html", category: "Pronunciation", date: "March 21, 2026" },
  { title: "Teaching Connected Speech — Activities and Exercises", description: "Linking, elision, assimilation, and weak forms with listening tasks.", href: "/blog/connected-speech-teaching-activities.html", category: "Pronunciation", date: "March 21, 2026" },
  { title: "Using the IPA Phonetic Alphabet in ESL Teaching", description: "When and how to introduce IPA symbols with practical classroom activities.", href: "/blog/ipa-phonetic-alphabet-esl-teaching.html", category: "Pronunciation", date: "March 21, 2026" },
  { title: "Accent Reduction Activities for ESL Students", description: "Intelligibility vs nativeness, diagnostic tools, and targeted practice.", href: "/blog/accent-reduction-activities-esl.html", category: "Pronunciation", date: "March 21, 2026" },
  // Phase 11: Homework & Independent Learning
  { title: "Effective ESL Homework Strategies That Students Actually Do", description: "Meaningful homework design, accountability systems, and feedback loops.", href: "/blog/effective-esl-homework-strategies.html", category: "Homework", date: "March 21, 2026" },
  { title: "Teaching Study Skills to English Learners", description: "Note-taking, time management, vocabulary notebooks, and revision techniques.", href: "/blog/teaching-study-skills-english-learners.html", category: "Homework", date: "March 21, 2026" },
  { title: "Encouraging Self-Directed Learning in ESL Students", description: "Learner training, goal setting, and autonomy-building strategies.", href: "/blog/self-directed-learning-esl.html", category: "Homework", date: "March 21, 2026" },
  { title: "Flipped Homework — Reversing In-Class and At-Home Tasks", description: "Video-based pre-learning, in-class practice, and blended learning models.", href: "/blog/flipped-homework-esl-classroom.html", category: "Homework", date: "March 21, 2026" },
  { title: "Best Digital Homework Tools for ESL Teachers in 2026", description: "Platform comparison for assigning, tracking, and grading ESL homework online.", href: "/blog/digital-homework-tools-esl-teachers.html", category: "Homework", date: "March 21, 2026" },
  // Phase 11: Motivation & Engagement
  { title: "Motivating Reluctant ESL Learners — Practical Strategies", description: "Identifying barriers, building rapport, and creating meaningful learning experiences.", href: "/blog/motivating-reluctant-esl-learners.html", category: "Motivation", date: "March 21, 2026" },
  { title: "Building Intrinsic Motivation in Language Learning", description: "Self-determination theory, autonomy, competence, and relatedness in ESL.", href: "/blog/intrinsic-motivation-language-learning.html", category: "Motivation", date: "March 21, 2026" },
  { title: "Fostering Student Autonomy in the ESL Classroom", description: "Choice boards, learning contracts, and self-directed projects.", href: "/blog/student-autonomy-esl-classroom.html", category: "Motivation", date: "March 21, 2026" },
  { title: "Using Rewards in the ESL Classroom — Dos and Don'ts", description: "Token economies, praise strategies, and avoiding reward dependency.", href: "/blog/using-rewards-esl-classroom.html", category: "Motivation", date: "March 21, 2026" },
  { title: "Growth Mindset in Language Learning — Activities and Strategies", description: "Fixed vs growth mindset, error positivity, and effort-based feedback.", href: "/blog/growth-mindset-language-learning.html", category: "Motivation", date: "March 21, 2026" },
  // Phase 11: Advanced Grammar
  { title: "Teaching the Subjunctive in English — When and How", description: "Mandative subjunctive, were-subjunctive, and practice contexts.", href: "/blog/teaching-subjunctive-english.html", category: "Advanced Grammar", date: "March 21, 2026" },
  { title: "Teaching Inversion in English — Advanced Grammar Activities", description: "Negative adverbials, conditional inversion, and formal register practice.", href: "/blog/teaching-inversion-english.html", category: "Advanced Grammar", date: "March 21, 2026" },
  { title: "Teaching Cleft Sentences — It-Clefts and What-Clefts", description: "Focus and emphasis structures with transformation and production activities.", href: "/blog/teaching-cleft-sentences-english.html", category: "Advanced Grammar", date: "March 21, 2026" },
  { title: "Teaching Ellipsis and Substitution in English", description: "Textual cohesion, so/do substitution, and discourse-level grammar.", href: "/blog/teaching-ellipsis-substitution-english.html", category: "Advanced Grammar", date: "March 21, 2026" },
  { title: "Teaching Mixed Conditionals — Activities and Worksheets", description: "Past-present and present-past conditionals with contextualized practice.", href: "/blog/teaching-mixed-conditionals-esl.html", category: "Advanced Grammar", date: "March 21, 2026" },
  // Phase 11: Listening Skills
  { title: "Teaching Listening Strategies to ESL Students", description: "Top-down, bottom-up, and metacognitive strategies for listening comprehension.", href: "/blog/teaching-listening-strategies-esl.html", category: "Listening", date: "March 21, 2026" },
  { title: "Dictation Activities for the ESL Classroom", description: "Running dictation, dictogloss, partial dictation, and communicative dictation.", href: "/blog/dictation-activities-esl-classroom.html", category: "Listening", date: "March 21, 2026" },
  { title: "Using Podcasts in ESL Teaching — Activities and Lesson Plans", description: "Podcast selection, pre-listening tasks, and follow-up activities by level.", href: "/blog/using-podcasts-esl-teaching.html", category: "Listening", date: "March 21, 2026" },
  { title: "Teaching Note-Taking Skills in English Classes", description: "Cornell method, mind maps, abbreviations, and academic listening practice.", href: "/blog/teaching-note-taking-skills-english.html", category: "Listening", date: "March 21, 2026" },
  { title: "Using Authentic Listening Materials in ESL — Tips and Sources", description: "TED Talks, news broadcasts, interviews, and grading authentic input.", href: "/blog/authentic-listening-materials-esl.html", category: "Listening", date: "March 21, 2026" },
  // Phase 11: Parent & Stakeholder Communication
  { title: "Communicating with ESL Parents — Tips and Templates", description: "Multilingual communication, progress updates, and building home-school partnerships.", href: "/blog/communicating-with-esl-parents.html", category: "Communication", date: "March 21, 2026" },
  { title: "Writing Student Progress Reports for ESL Classes", description: "CEFR-aligned descriptors, strengths/areas format, and report templates.", href: "/blog/writing-student-progress-reports-esl.html", category: "Communication", date: "March 21, 2026" },
  { title: "Parent-Teacher Conferences for ESL — Preparation Guide", description: "Conference structure, visual aids, and navigating language barriers.", href: "/blog/parent-teacher-conferences-esl.html", category: "Communication", date: "March 21, 2026" },
  { title: "Advocating for ELL Students in Your School", description: "Policy awareness, accommodation requests, and data-driven advocacy.", href: "/blog/advocating-for-ell-students.html", category: "Communication", date: "March 21, 2026" },
  { title: "Collaborating with Mainstream Teachers as an ESL Specialist", description: "Co-teaching models, content-language integration, and shared planning.", href: "/blog/collaborating-with-mainstream-teachers-esl.html", category: "Communication", date: "March 21, 2026" },
  // Phase 13: TOEFL & Standardized Tests
  { title: "TOEFL Preparation Strategies for ESL Teachers", description: "Section-by-section strategies, practice materials, and score improvement techniques.", href: "/blog/toefl-preparation-strategies-teachers.html", category: "Standardized Tests", date: "March 24, 2026" },
  { title: "TOEIC Preparation — Worksheets and Practice Guide", description: "Listening and reading sections, business vocabulary, and test-day strategies.", href: "/blog/toeic-preparation-worksheets-guide.html", category: "Standardized Tests", date: "March 24, 2026" },
  { title: "Duolingo English Test Preparation — Teacher's Guide", description: "Adaptive format, question types, and preparation activities for students.", href: "/blog/duolingo-english-test-preparation.html", category: "Standardized Tests", date: "March 24, 2026" },
  { title: "Teaching Test-Taking Strategies to ESL Students", description: "Time management, elimination techniques, and anxiety reduction strategies.", href: "/blog/teaching-test-taking-strategies-esl.html", category: "Standardized Tests", date: "March 24, 2026" },
  { title: "IELTS vs TOEFL vs Cambridge vs TOEIC — Which Test for Your Student?", description: "Format comparison, scoring, acceptance, and choosing the right exam.", href: "/blog/standardized-test-comparison-esl.html", category: "Standardized Tests", date: "March 24, 2026" },
  // Phase 13: Classroom Language
  { title: "Essential Classroom Language for ESL Teachers", description: "Grading language, checking understanding, and managing interaction patterns.", href: "/blog/classroom-language-esl-teachers.html", category: "Classroom Language", date: "March 24, 2026" },
  { title: "Giving Clear Instructions in the ESL Classroom", description: "ICQs, staging instructions, and demonstration techniques.", href: "/blog/giving-instructions-esl-classroom.html", category: "Classroom Language", date: "March 24, 2026" },
  { title: "Concept Checking Questions (CCQs) — The ESL Teacher's Secret Weapon", description: "Writing effective CCQs for grammar, vocabulary, and functional language.", href: "/blog/concept-checking-questions-esl.html", category: "Classroom Language", date: "March 24, 2026" },
  { title: "Reducing Teacher Talking Time — Practical Strategies", description: "Student-centered activities, wait time, and minimizing unnecessary TTT.", href: "/blog/teacher-talking-time-reducing.html", category: "Classroom Language", date: "March 24, 2026" },
  { title: "Eliciting Techniques for ESL Teaching", description: "Visuals, prompts, context, and question types for effective elicitation.", href: "/blog/eliciting-techniques-esl-teaching.html", category: "Classroom Language", date: "March 24, 2026" },
  // Phase 13: Reading Skills
  { title: "Teaching Skimming and Scanning — Reading Strategies for ESL", description: "Timed reading tasks, gist questions, and specific information hunting.", href: "/blog/teaching-skimming-scanning-esl.html", category: "Reading", date: "March 24, 2026" },
  { title: "Teaching Critical Reading Skills to ESL Students", description: "Identifying bias, evaluating sources, and analyzing argument structure.", href: "/blog/teaching-critical-reading-esl.html", category: "Reading", date: "March 24, 2026" },
  { title: "Graded Readers — A Complete Guide for ESL Teachers", description: "Publisher comparison, level selection, and reading program implementation.", href: "/blog/graded-readers-guide-esl-teachers.html", category: "Reading", date: "March 24, 2026" },
  { title: "Teaching Reading Fluency in ESL Classes", description: "Repeated reading, timed reading, and fluency assessment techniques.", href: "/blog/teaching-reading-fluency-esl.html", category: "Reading", date: "March 24, 2026" },
  { title: "Using Newspaper Articles in ESL Lessons", description: "Headline analysis, jigsaw reading, and news-based discussion activities.", href: "/blog/newspaper-articles-esl-lessons.html", category: "Reading", date: "March 24, 2026" },
  // Phase 13: Online & Hybrid
  { title: "Hybrid Teaching Strategies for ESL Classes", description: "Simultaneous in-person and online instruction with engagement techniques.", href: "/blog/hybrid-teaching-esl-strategies.html", category: "Online Teaching", date: "March 24, 2026" },
  { title: "Breakout Room Activities for Online ESL Classes", description: "Structured pair and group tasks for Zoom, Meet, and Teams breakout rooms.", href: "/blog/breakout-rooms-esl-activities.html", category: "Online Teaching", date: "March 24, 2026" },
  { title: "Digital Whiteboard Activities for ESL Teachers", description: "Jamboard, Miro, and Whiteboard.fi activities for interactive online lessons.", href: "/blog/digital-whiteboard-activities-esl.html", category: "Online Teaching", date: "March 24, 2026" },
  { title: "Asynchronous Learning Activities for ESL Students", description: "Self-paced tasks, video assignments, and discussion boards for ESL.", href: "/blog/asynchronous-learning-esl.html", category: "Online Teaching", date: "March 24, 2026" },
  { title: "Building Community in Online ESL Classes", description: "Ice-breakers, social activities, and fostering connection in virtual classrooms.", href: "/blog/building-community-online-esl-class.html", category: "Online Teaching", date: "March 24, 2026" },
  // Phase 13: Speaking & Fluency
  { title: "Fluency Activities for the ESL Classroom", description: "4/3/2 technique, speed dating, and information gap fluency drills.", href: "/blog/fluency-activities-esl-classroom.html", category: "Speaking", date: "March 24, 2026" },
  { title: "Structuring Conversation Classes for ESL Students", description: "Topic selection, scaffolding, and managing mixed-level conversation groups.", href: "/blog/conversation-classes-esl-structure.html", category: "Speaking", date: "March 24, 2026" },
  { title: "Teaching Functional Language — Requests, Complaints, Suggestions", description: "Speech act worksheets, role-plays, and appropriacy practice.", href: "/blog/teaching-functional-language-esl.html", category: "Speaking", date: "March 24, 2026" },
  { title: "The Shadowing Technique — Improving Pronunciation and Fluency", description: "Step-by-step shadowing method with audio selection and progress tracking.", href: "/blog/shadowing-technique-esl.html", category: "Speaking", date: "March 24, 2026" },
  { title: "Impromptu Speaking Activities for ESL Classes", description: "1-minute talks, opinion chains, and spontaneous speaking confidence builders.", href: "/blog/impromptu-speaking-activities-esl.html", category: "Speaking", date: "March 24, 2026" },
  // Phase 13: Feedback & Correction
  { title: "Giving Effective Written Feedback to ESL Students", description: "Focused vs comprehensive feedback, margin notes, and feedforward techniques.", href: "/blog/giving-written-feedback-esl.html", category: "Feedback", date: "March 24, 2026" },
  { title: "When and How to Correct Speaking Errors in ESL", description: "On-the-spot vs delayed correction, recasting, and reformulation.", href: "/blog/oral-correction-timing-techniques.html", category: "Feedback", date: "March 24, 2026" },
  { title: "Using Marking Codes for ESL Writing Correction", description: "Standard marking codes, student self-correction, and error logs.", href: "/blog/marking-codes-esl-writing.html", category: "Feedback", date: "March 24, 2026" },
  { title: "One-on-One Conferencing with ESL Students — Feedback Guide", description: "Conference structure, questioning techniques, and goal-setting dialogue.", href: "/blog/conferencing-with-esl-students.html", category: "Feedback", date: "March 24, 2026" },
  { title: "Creating a Positive Error Culture in the ESL Classroom", description: "Normalizing mistakes, growth language, and error-as-learning activities.", href: "/blog/positive-error-culture-esl.html", category: "Feedback", date: "March 24, 2026" },
  // Phase 14: Classroom Management Advanced (5)
  { title: "Managing Behavior in the ESL Classroom", description: "Positive discipline, behavior contracts, and de-escalation strategies for language classes.", href: "/blog/managing-behavior-esl-classroom.html", category: "Classroom Management", date: "March 25, 2026" },
  { title: "Seating Arrangements for the ESL Classroom — What Works", description: "U-shape, clusters, rows, and flexible seating with activity-type matching.", href: "/blog/seating-arrangements-esl-classroom.html", category: "Classroom Management", date: "March 25, 2026" },
  { title: "Smooth Transitions Between Activities in ESL Classes", description: "Transition signals, timer techniques, and maintaining momentum between tasks.", href: "/blog/transitions-activities-esl-classroom.html", category: "Classroom Management", date: "March 25, 2026" },
  { title: "Energy Management in ESL Lessons — Pacing and Flow", description: "Stirrers vs settlers, lesson arc, and balancing high-energy with focused work.", href: "/blog/energy-management-esl-lessons.html", category: "Classroom Management", date: "March 25, 2026" },
  { title: "Managing Large ESL Classes — Strategies for 30+ Students", description: "Monitoring techniques, choral work, group roles, and efficient feedback in large groups.", href: "/blog/managing-large-esl-classes.html", category: "Classroom Management", date: "March 25, 2026" },
  // Phase 14: Writing Skills Deep Dive (5)
  { title: "Teaching Essay Structure to ESL Students", description: "Introduction-body-conclusion, thesis statements, topic sentences, and paragraph unity.", href: "/blog/teaching-essay-structure-esl.html", category: "Writing", date: "March 25, 2026" },
  { title: "The Process Writing Approach in ESL Teaching", description: "Brainstorming, drafting, revising, editing, and publishing stages with classroom activities.", href: "/blog/process-writing-approach-esl.html", category: "Writing", date: "March 25, 2026" },
  { title: "Running Peer Editing Workshops in ESL Classes", description: "Training students in peer review, feedback forms, and structured editing protocols.", href: "/blog/peer-editing-workshops-esl.html", category: "Writing", date: "March 25, 2026" },
  { title: "Journal Writing for ESL Students — Ideas and Implementation", description: "Dialogue journals, reflective journals, and creative journal prompts by level.", href: "/blog/journal-writing-esl-students.html", category: "Writing", date: "March 25, 2026" },
  { title: "Portfolio Assessment for ESL Writing — Complete Guide", description: "Selection criteria, reflection tasks, showcase vs working portfolios, and grading.", href: "/blog/portfolio-assessment-esl-writing.html", category: "Writing", date: "March 25, 2026" },
  // Phase 14: ESP by Industry (5)
  { title: "Teaching Medical English — Vocabulary, Scenarios, and Resources", description: "Medical terminology, patient communication, case studies, and role-plays for healthcare.", href: "/blog/teaching-medical-english.html", category: "ESP", date: "March 25, 2026" },
  { title: "Teaching Legal English — Contracts, Court Language, and Case Studies", description: "Legal vocabulary, contract analysis, moot court activities, and plain English drafting.", href: "/blog/teaching-legal-english.html", category: "ESP", date: "March 25, 2026" },
  { title: "Teaching English for Hospitality and Tourism", description: "Hotel, restaurant, and travel agency scenarios with functional language worksheets.", href: "/blog/teaching-english-hospitality-tourism.html", category: "ESP", date: "March 25, 2026" },
  { title: "Teaching English for IT Professionals", description: "Technical documentation, Agile vocabulary, code review language, and presentation skills.", href: "/blog/teaching-english-it-professionals.html", category: "ESP", date: "March 25, 2026" },
  { title: "Teaching Aviation English — ICAO Standards and Radiotelephony", description: "ICAO Level 4+ requirements, radiotelephony phrases, and emergency communication drills.", href: "/blog/teaching-aviation-english.html", category: "ESP", date: "March 25, 2026" },
  // Phase 14: CLIL & Bilingual Education (5)
  { title: "CLIL Methodology — A Complete Guide for Language Teachers", description: "Content and Language Integrated Learning: the 4Cs framework, lesson planning, and assessment.", href: "/blog/clil-methodology-complete-guide.html", category: "CLIL", date: "March 25, 2026" },
  { title: "Teaching Science Through English — CLIL Activities", description: "Lab reports, experiment descriptions, and scientific vocabulary scaffolding.", href: "/blog/teaching-science-through-english.html", category: "CLIL", date: "March 25, 2026" },
  { title: "English as Medium of Instruction (EMI) — Teacher's Guide", description: "Lecture scaffolding, academic language support, and student comprehension strategies.", href: "/blog/emi-english-medium-instruction-guide.html", category: "CLIL", date: "March 25, 2026" },
  { title: "Bilingual Education Models — Comparison and Implementation", description: "Transitional, maintenance, dual-language, and immersion models with pros and cons.", href: "/blog/bilingual-education-models-comparison.html", category: "CLIL", date: "March 25, 2026" },
  { title: "Teaching Academic Language Functions in CLIL", description: "Classifying, hypothesizing, comparing, evaluating — language frames by subject area.", href: "/blog/academic-language-functions-clil.html", category: "CLIL", date: "March 25, 2026" },
  // Phase 14: Assessment Design (5)
  { title: "Designing English Midterm and Final Exams", description: "Item types, specification tables, timing, difficulty calibration, and answer key design.", href: "/blog/designing-english-midterm-final-exams.html", category: "Assessment", date: "March 25, 2026" },
  { title: "Designing Cloze Tests for ESL — Types and Best Practices", description: "Fixed-ratio, rational, C-test, and banked cloze with scoring approaches.", href: "/blog/cloze-test-design-esl.html", category: "Assessment", date: "March 25, 2026" },
  { title: "Item Analysis for English Tests — Improving Your Exams", description: "Facility value, discrimination index, distractor analysis, and test reliability.", href: "/blog/item-analysis-english-tests.html", category: "Assessment", date: "March 25, 2026" },
  { title: "The Washback Effect in Language Testing", description: "Positive vs negative washback, test design for learning, and alignment strategies.", href: "/blog/washback-effect-language-testing.html", category: "Assessment", date: "March 25, 2026" },
  { title: "Alternative Assessment in the ESL Classroom", description: "Presentations, podcasts, vlogs, infographics, and performance-based assessment rubrics.", href: "/blog/alternative-assessment-esl-classroom.html", category: "Assessment", date: "March 25, 2026" },
  // Phase 14: Inclusive & Diverse Classrooms (5)
  { title: "Neurodiversity in the ESL Classroom — ADHD, Autism, and Dyslexia", description: "Accommodations, multisensory techniques, and differentiated materials for neurodiverse learners.", href: "/blog/neurodiversity-esl-classroom.html", category: "Inclusive Teaching", date: "March 25, 2026" },
  { title: "Trauma-Informed Teaching in ESL Classes", description: "Safety, predictability, choice, and relationship-building for trauma-affected students.", href: "/blog/trauma-informed-teaching-esl.html", category: "Inclusive Teaching", date: "March 25, 2026" },
  { title: "Culturally Responsive Teaching in ESL — Practical Strategies", description: "Funds of knowledge, identity texts, and culturally sustaining pedagogy.", href: "/blog/culturally-responsive-teaching-esl.html", category: "Inclusive Teaching", date: "March 25, 2026" },
  { title: "Teaching Gender-Inclusive Language in ESL", description: "Pronouns, titles, occupational nouns, and navigating evolving language norms.", href: "/blog/gender-inclusive-language-esl.html", category: "Inclusive Teaching", date: "March 25, 2026" },
  { title: "Heritage Speakers in the ESL Classroom — Challenges and Strategies", description: "Bidialectal literacy, academic register development, and identity affirmation.", href: "/blog/heritage-speakers-esl-classroom.html", category: "Inclusive Teaching", date: "March 25, 2026" },
];

const Blog = () => {
  useEffect(() => {
    document.title = "Edooqoo Blog — Tips, Guides & Resources for English Teachers";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute('content', 'Practical articles for English teachers: AI teaching tips, worksheet creation guides, classroom management, CEFR assessment strategies, and ESL/EFL best practices.');
    }

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Blog",
      "name": "Edooqoo Blog",
      "description": "Practical articles for English teachers: AI teaching tips, worksheet creation guides, CEFR assessment strategies, and ESL/EFL best practices.",
      "url": "https://edooqoo.com/blog",
      "publisher": { "@type": "Organization", "name": "Edooqoo", "url": "https://edooqoo.com" },
      "blogPost": blogPosts.map(p => ({
        "@type": "BlogPosting",
        "headline": p.title,
        "url": `https://edooqoo.com${p.href}`,
        "datePublished": "2026-03-11"
      }))
    });
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, []);

  const categories = [...new Set(blogPosts.map(p => p.category))];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-primary">Edooqoo</Link>
          <div className="flex items-center gap-4">
            <Link to="/pricing" className="text-sm text-muted-foreground hover:text-primary transition-colors">Pricing</Link>
            <Link to="/signup" className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 transition-opacity">Sign Up Free</Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold text-foreground mb-4">Edooqoo Blog</h1>
        <p className="text-lg text-muted-foreground mb-12">
          Practical articles for English teachers — AI teaching tips, worksheet guides, CEFR assessment, and ESL/EFL best practices.
        </p>

        {categories.map(cat => (
          <section key={cat} className="mb-12">
            <h2 className="text-2xl font-semibold text-foreground mb-6">{cat}</h2>
            <div className="space-y-4">
              {blogPosts.filter(p => p.category === cat).map(post => (
                <a
                  key={post.href}
                  href={post.href}
                  className="block rounded-lg border bg-card p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">{post.title}</h3>
                      <p className="text-sm text-muted-foreground">{post.description}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{post.date}</span>
                  </div>
                </a>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
};

export default Blog;

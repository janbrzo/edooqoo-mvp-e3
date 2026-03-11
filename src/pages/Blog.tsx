
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

# StudyBot - Privacy Policy

**Last Updated:** February 16, 2026

## 1. Introduction

StudyBot ("we," "us," "our," or "Company") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use the StudyBot Chrome extension.

## 2. Information We Collect

### 2.1 Content You Extract
When you use StudyBot to extract content from webpages:
- **Extracted Text**: The text content you select or that our extension extracts from a webpage
- **Page Metadata**: The webpage URL and title
- **Usage Pattern**: Which websites you extract from (not the content, only the domain)

This information is stored **locally on your device** in Chrome's local storage and is never transmitted to our servers unless you explicitly choose to use our proxy service.

### 2.2 Canvas LMS Data (If Connected)
If you connect your Canvas LMS account:
- **Canvas API Token**: Used only to authenticate requests to your Canvas instance
- **Courses and Assignments**: Metadata about your enrolled courses and assignments
- **Canvas Content**: The text you select to create study materials from

Your Canvas token and content **remain confidential** and are only stored locally on your device.

### 2.3 Claude API Key (If Provided)
If you provide your own Claude API key:
- **API Key**: Stored locally on your device
- **API Usage**: Requests are made directly from your browser to Claude's API
- Your key is **never transmitted to StudyBot servers**.

### 2.4 Usage Analytics (Optional)
If you enable optional analytics:
- **Generation Count**: Number of study materials generated (for freemium tier tracking)
- **Generation Types**: Which types (summaries/flashcards/quizzes) you use most
- **Error Events**: If/when features fail (helps us fix bugs)

Analytics data is **anonymized** and does not include your actual study content.

## 3. How We Use Your Information

- **Generate Study Materials**: To create summaries, flashcards, and quizzes from your content
- **Improve the Extension**: To understand which features are used and what breaks
- **Enforce Usage Limits**: To track free tier usage (5 generations/month)
- **Support Canvas Integration**: To fetch courses and assignments with your permission

## 4. Data Storage & Security

### 4.1 Local Storage
All your study materials are stored **locally** in Chrome's storage:
- Not encrypted (Chrome handles browser-level security)
- Not backed up to cloud (deleted if you uninstall the extension)
- Never transmitted without your explicit action

### 4.2 API Requests
- **Claude API**: Requests go directly from your browser to Anthropic's servers. See their [Privacy Policy](https://www.anthropic.com/privacy).
- **Canvas API**: Requests go directly from your browser to your Canvas instance.
- **StudyBot Proxy** (optional): If you use our free tier proxy, requests include the extracted content (which is then deleted after processing).

### 4.3 No Data Selling
We **do not**:
- Sell your data to third parties
- Use your study content for training AI models
- Track you across websites
- Share data with advertisers

## 5. Third-Party Services

### 5.1 Claude API (Anthropic)
If you use Claude for generation:
- Text is sent to Anthropic's servers
- See [Anthropic's Privacy Policy](https://www.anthropic.com/privacy)
- Anthropic may use inputs/outputs per their policy

### 5.2 Canvas LMS
If you connect Canvas:
- Requests go to your school's Canvas instance
- Your school's privacy policy applies
- We do not access Canvas without your explicit consent

### 5.3 StudyBot Proxy (Free Tier)
If you use the free tier proxy:
- Content is sent to our servers for processing
- Content is deleted immediately after processing
- We do not store your study materials

## 6. User Rights

You can:
- **Export Your Data**: Download all study sets as JSON
- **Delete Your Data**: Clear all materials from Settings
- **Disable Analytics**: Opt-out of usage tracking
- **Revoke Permissions**: Disconnect Canvas or remove API key at any time

## 7. Data Retention

- **Local Study Materials**: Stored until you delete them or uninstall the extension
- **Canvas Token/API Key**: Stored until you disconnect or remove them
- **Analytics**: Cleared monthly; usage count resets on the 1st of each month
- **Proxy Server Data**: Deleted immediately after processing (not stored)

## 8. Children's Privacy

StudyBot is not intended for children under 13. We do not knowingly collect information from children under 13. If we learn we have collected personal information from a child under 13, we will delete it immediately.

## 9. Policy Updates

We may update this Privacy Policy periodically. We will notify you of material changes by:
- Updating the "Last Updated" date
- Providing notice in the extension

Your continued use of StudyBot after changes constitutes acceptance of the updated Privacy Policy.

## 10. Contact Us

If you have questions about this Privacy Policy:

**Email**: privacy@studybot.dev  
**Website**: https://studybot.dev  
**GitHub**: https://github.com/lucasbhatia/studybot

---

## Summary

**tl;dr:**
- Your study content stays on your device
- We don't sell your data
- Canvas tokens and API keys are only stored locally
- Free tier usage is tracked locally (5 generations/month)
- You can export or delete everything anytime

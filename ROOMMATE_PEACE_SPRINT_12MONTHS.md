# Roommate Peace — 12-Month Sprint to $10k/mo

## Current State
- 50% complete
- Private/dev-only
- Tech: Next.js 16.2.4, Supabase, Stripe (stubbed), Resend (installed but not wired)
- Missing: Stripe payments, email notifications, public landing page, marketing

## Target
- **Month 12**: 1,400+ active subscribers → $10k/mo revenue
- **Pricing**: $7/mo or $59/year
- **Conversion assumption**: 1% of signups → $10k/mo = ~1,400 active users

---

## Month 1-2: Complete Core App (Stripe + Email)

**Goal**: App is feature-complete and testable with real payments

### Week 1-2: Stripe Integration
- [ ] Wire up Stripe API (use existing `lib/stripe/client.ts` stub)
- [ ] Create subscription checkout page
- [ ] Handle successful payment → update user subscription status in Supabase
- [ ] Create subscription management page (view plan, upgrade, cancel)
- [ ] Test with Stripe test keys

**Deliverable**: You can sign up → pay $7 → see confirmation

### Week 3-4: Email Notifications (Resend)
- [ ] Wire up Resend (already installed)
- [ ] Send welcome email after signup
- [ ] Send weekly conflict summary (digest of roommate arguments/resolutions)
- [ ] Send billing receipt after payment
- [ ] Send "your trial expires in 3 days" reminder

**Deliverable**: Confirmation emails arrive in inbox after signup

### Week 5-6: Billing Page + Receipts
- [ ] Create `/app/billing` page (show current subscription)
- [ ] Add invoice history
- [ ] Generate PDF receipts (use a library like `html2pdf` or `pdfkit`)
- [ ] Email receipts automatically

**Deliverable**: Full subscription lifecycle works

### Week 7-8: Bug fixes + Polish
- [ ] Test full signup → payment → email flow 5 times
- [ ] Fix Tailwind styling issues
- [ ] Verify RLS (row-level security) works correctly in Supabase
- [ ] Write down any gotchas in docs/SETUP.md

**Success Metric**: You can sign up, pay, and receive emails. No crashes.

---

## Month 3: Private Beta (20 Testers)

**Goal**: Real users testing the app. Collect feedback.

### Week 9-10: Invite System
- [ ] Create shareable invite link
- [ ] Build invite management page (see who you invited, status)
- [ ] Auto-create household when user accepts invite
- [ ] Test with 5 friends

**Deliverable**: You can invite friends, they sign up, appear as roommates

### Week 11-12: Beta Feedback Loop
- [ ] Invite 20 people (friends, family, online communities)
- [ ] Create feedback form (Google Form is fine)
- [ ] Collect 30+ pieces of feedback
- [ ] Log bugs/feature requests in `docs/FEEDBACK.md`

**Success Metric**: 10-20 active testers, using app for real

---

## Month 4: Bug Fixes + UX Polish

**Goal**: App is smooth. No friction.

### Week 13-14: Critical Bug Fixes
- [ ] Fix bugs from beta feedback (likely: login issues, data sync, email delivery)
- [ ] Test on mobile (app probably looks bad on phone)
- [ ] Fix mobile UX
- [ ] Test on different browsers (Chrome, Safari, Firefox)

### Week 15-16: Feature Prioritization
- [ ] Review 30+ feedback items
- [ ] Pick top 3 features users asked for
- [ ] Build ONE of them (the most-requested)
- [ ] Example: "export chore list as PDF" or "notifications for unresolved conflicts"

**Success Metric**: Beta testers say "this is actually useful"

---

## Month 5-6: Public Launch (Landing Page + Product Hunt)

**Goal**: Get from 20 testers to 200+ public signups

### Week 17-18: Landing Page
- [ ] Create public landing page (`/app` is still private, but `/` is public)
- [ ] Copy: "Stop arguing about chores. Get accountability." (see CLAUDE.md positioning)
- [ ] Add: problem statement, demo video or screenshots, pricing, CTA ("Start Free Trial")
- [ ] Add: testimonials from beta testers
- [ ] Optimize for mobile

**Deliverable**: landingpage looks professional, not homemade

### Week 19-20: Free Trial (14 Days)
- [ ] Change Stripe subscription to 14-day free trial
- [ ] Copy changes to "Try free for 14 days, then $7/mo"
- [ ] Test trial → conversion flow
- [ ] Send "trial expires in 3 days" email

### Week 21-22: Product Hunt Launch
- [ ] Post to Product Hunt
- [ ] Get 3-5 beta testers to upvote
- [ ] Answer questions for 24 hours
- [ ] Collect feedback/signups

**Success Metric**: 50-100 new signups from Product Hunt

---

## Month 7-9: Growth Phase (Marketing + Referral)

**Goal**: Grow from 200 users to 600+ users. Hit $3k/mo.

### Week 23-24: Referral System
- [ ] Create referral link (every user gets unique URL)
- [ ] Reward: Invite friend → both get 1 month free
- [ ] Build referral page (show "You've referred X friends")
- [ ] Test referral flow

**Deliverable**: Existing users can invite friends and get rewarded

### Week 25-30: Content Marketing
- [ ] Write 4 blog posts (use Resend + landing page blog section)
  - "How to Stop Fighting with Roommates About Chores"
  - "Fair Ways to Split Bills"
  - "The Psychology of Roommate Conflict"
  - "Best Roommate Apps (ours wins)"
- [ ] SEO optimize (basic: keywords in title, meta description)
- [ ] Promote on Reddit (r/college, r/housing, etc.)

### Week 31-32: Email Newsletter
- [ ] Add newsletter signup to landing page
- [ ] Send weekly: tips for roommate harmony, feature updates
- [ ] Build to 100+ newsletter subscribers

**Success Metric**: 600+ active users, $3k/mo, first paying customers

---

## Month 10-12: Optimization + Second Feature

**Goal**: Hit $10k/mo. Prepare for 2027 scaling.

### Week 33-36: Bill-Splitting Feature (Major Feature)
- [ ] Users can track shared expenses (groceries, utilities, rent)
- [ ] App calculates who owes whom
- [ ] Integration with Venmo (link to payment)
- [ ] Test with beta users first

**Why**: Chore management alone is $7/mo product. Add bill-splitting → justifies $15-20/mo

**Deliverable**: Users can split bills. Conflicts drop by 50%.

### Week 37-40: Monetization Optimization
- [ ] A/B test pricing ($7 vs $10 vs $15/mo)
- [ ] Add "Teams" plan (for 5+ roommates at $20/mo)
- [ ] Upsell existing users to higher tier
- [ ] Implement annual discount (still $59/year, but emphasize savings)

### Week 41-44: Retention + Churn Reduction
- [ ] Analyze: Which users cancel? Why?
- [ ] Create win-back email for churned users ("We miss you!")
- [ ] Add onboarding tutorial (first time users skip it)
- [ ] Measure: reduce churn from 5% to 3%

### Week 45-48: Scale Preparation
- [ ] Document architecture (for future devs or investors)
- [ ] Set up monitoring (error tracking, performance)
- [ ] Create user support template (FAQs, email responses)
- [ ] Plan Month 13+: What's next? (mobile app? API? B2B?)

**Success Metric**: 1,400+ active users, $10k/mo, sustainable

---

## How to Use This

**Every Monday**:
1. Open this file
2. Check current week
3. Pick 2-3 deliverables for the week
4. Update progress at bottom of file

**Blockers**:
- If you get stuck: "Stripe integration is broken"
- Post the exact error + code in `CLAUDE.md` blockers section
- Ask Claude Code for help

**Flexibility**:
- If a month takes 6 weeks, shift everything back
- If a feature is harder than expected, cut scope
- Goal is $10k/mo in 12 months, not exact timeline

---

## Metrics to Track

Add to SPRINT.md each month:

```
## Month [X] Results

- Active users: [number]
- MRR (monthly recurring revenue): $[amount]
- Churn rate: [%]
- Conversion rate (signups → paid): [%]
- NPS (Net Promoter Score): [score]
- Issues created/fixed: [number]
- Time spent: [hours]
- Blockers: [list]
- Next month priority: [1-3 things]
```

---

## Success = $10k/mo by Month 12

Not earlier. Not later.

If you hit it in Month 10, congrats. Spend Month 11-12 on retention + preparation for scaling.

If you're at Month 12 and only at $5k/mo, we pivot strategy (different pricing, different market, different feature).

**But the goal is clear: $10k/mo by end of 2026, so you can leave Amazon in early 2027.**

Let's go.

 Association Website – Requirements Coverage

Mapping of the 14 required sections against the current AHTTAK implementation.

---

Summary

|  | Section | Status | Coverage |
|---|---------|--------|----------|
| 1 | Home Page | Partial | Needs Chairperson message, announcements, CPD highlights |
| 2 | About Us | Partial | Needs vision/mission, objectives, constitution, org structure |
| 3 | Leadership | Done | TeamMember (Board, Management, Team); regional reps not explicit |
| 4 | Membership | Partial | Categories, online form exist; eligibility, benefits, renewal info partial |
| 5 | CPD | Partial | Events have cpd_points; no dedicated CPD page/calendar/materials |
| 6 | News & Updates | Done | Blog as announcements; policy/press release categories possible |
| 7 | Resources | Missing | No guidelines, disease surveillance, publications, links |
| 8 | Events & Conferences | Done | Events, registration; past summaries via event status |
| 9 | Member Portal | Done | Login, profile, contributions; CPD tracking & certs partial |
| 10 | Projects & Partnerships | Missing | No models or pages |
| 11 | Gallery / Media | Missing | No gallery model or page |
| 12 | Jobs & Opportunities | Missing | No job listings, internships, tenders |
| 13 | Downloads | Missing | No download library (forms, plans, reports, guidelines) |
| 14 | Contact Us | Done | Office, phone, email, contact form, social links; map partial |

---

 1. Home Page

**Required:**
- Welcome message from Chairperson/President
- Brief introduction to the association
- Latest news and announcements
- Upcoming events and CPD highlights
- Quick links to membership, events, and contacts

**Current:**
- `Landing.tsx`: hero with generic welcome, "Why AHTTAK?", CTA
- Events: shown on `/events` (separate page)
- Blog: `/blog` (separate page)
- No Chairperson message; no CPD highlights on home; no quick links section

**Gaps:** Chairperson message field, announcements widget, CPD highlights block, quick links block

---

## 2. About Us

**Required:**
- History of the association
- Vision, Mission, Core Values
- Objectives
- Organizational structure
- Constitution and governance documents

**Current:**
- `About.tsx`: one paragraph intro + Board & Team (Leadership)
- No vision/mission, objectives, history, constitution
- TeamMember `department` groups Board/Management/Team (structure partially covered)

**Gaps:** History, Vision, Mission, Core Values, Objectives; constitution/governance documents (can link to Downloads)

---

## 3. Leadership

**Required:**
- National officials
- Board members
- Regional representatives
- Profiles and photos of leaders

**Current:**
- `TeamMember` model: name, photo, designation, department (Board/Management/Team), qualifications, bio
- `About.tsx` (full): sections Board of Directors, Management, Our Team with profiles and photos
- No "National officials" vs "Regional representatives" distinction; use `department` for grouping

**Gaps:** Regional representatives (extend `department` or add region); "National officials" as a department

---

## 4. Membership

**Required:**
- Membership categories
- Eligibility and requirements
- Membership benefits
- Online application form
- Membership renewal information

**Current:**
- `MembershipType`: categories and fees
- `MemberRegister` (public): online application
- `/register` route; membership types listed in form
- Renewal: member dashboard, payments; no dedicated renewal info page

**Gaps:** Dedicated membership page with eligibility, requirements, benefits text; renewal information page/section

---

## 5. CPD (Continuing Professional Development)

**Required:**
- Upcoming CPD events
- CPD calendar
- Online registration
- CPD points information
- Training materials and reports

**Current:**
- `Event.cpd_points` field; events can be CPD
- Event registration works for any event
- No CPD filter on events; no CPD calendar; no CPD points summary for members
- No training materials or reports

**Gaps:** CPD-specific event filter, CPD calendar view, CPD points display in member portal, training materials/reports (could use Resources or Downloads)

---

## 6. News & Updates

**Required:**
- Association announcements
- Industry news
- Policy updates
- Press releases

**Current:**
- `BlogPost` with categories and tags
- `/blog` list and `/blog/:slug` detail
- Use categories: Announcements, Industry News, Policy Updates, Press Releases

**Gaps:** Ensure categories exist and are surfaced; optional "Featured" for home page

---

## 7. Resources

**Required:**
- Professional guidelines
- Disease surveillance updates
- Publications and research
- Links to relevant institutions

**Current:**
- None

**Gaps:** New Resources section: model (Resource: title, type, file/link, category), API, `/resources` page, optional categories (Guidelines, Surveillance, Publications, Links)

---

## 8. Events & Conferences

**Required:**
- Upcoming workshops
- Conferences
- Event registration
- Past event summaries

**Current:**
- `Event` model with categories (AGM, Training, Workshop, Seminar, Social)
- `PublicEvents` page, `PublicEventDetail`, event registration
- Past events: filter by status "completed" or end_date

**Gaps:** "Past event summaries" section or filter; workshops/conferences already covered by event categories

---

## 9. Member Portal

**Required:**
- Member login
- Profile management
- CPD points tracking
- Certificate downloads
- Membership renewal and payments

**Current:**
- Login: `/login` → token
- Profile: `/dashboard/members/:id` (My account)
- Contributions, savings, events in dashboard
- `Event.certificate_issued`; no certificate download flow
- Payments/renewal via Payments in dashboard
- No CPD points aggregation or display

**Gaps:** CPD points tracking and display; certificate download (per event or summary); clearer renewal flow

---

## 10. Projects & Partnerships

**Required:**
- Collaborating organizations
- Training initiatives
- Donor-supported projects
- Community animal health programs

**Current:**
- None

**Gaps:** New Projects/Partnerships section: model (Project: title, description, partners, type), API, `/projects` page

---

## 11. Gallery / Media

**Required:**
- Photo galleries
- Event images
- Videos of activities

**Current:**
- None
- Event banners exist but no dedicated gallery

**Gaps:** Gallery model (Album, GalleryImage/Media), API, `/gallery` page; optional event-linked albums

---

## 12. Jobs & Opportunities

**Required:**
- Veterinary job listings
- Internships
- Volunteer opportunities
- Tenders and project calls

**Current:**
- None

**Gaps:** Jobs model (Job: title, type [job/internship/volunteer/tender], description, deadline, organization), API, `/jobs` page

---

## 13. Downloads

**Required:**
- Membership forms
- Strategic plans
- Annual reports
- CPD guidelines
- Association constitution

**Current:**
- None
- No central download library

**Gaps:** Downloads model (Download: title, category, file, description), API, `/downloads` page with categories

---

## 14. Contact Us

**Required:**
- Office location
- Phone and email contacts
- Contact form
- Social media links
- Map location

**Current:**
- `SiteSettings`: phone_numbers, email, address, google_map_embed, social_links
- `Contact.tsx`: contact form (name, email, phone, subject, message)
- API: contact message submission
- Map: `google_map_embed` exists; ensure Contact page displays it

**Gaps:** Verify Contact page shows address, phone, email, social links, and map; add if missing

---

## Recommended Implementation Order

**Phase 1 – Content and structure**
1. Extend `SiteSettings` or add `HomePageContent`: Chairperson message, intro, quick links
2. Extend `SiteSettings` or add `AboutContent`: History, Vision, Mission, Core Values, Objectives
3. Ensure Contact page displays all contact fields and map

**Phase 2 – New sections**
4. Resources (model, API, page)
5. Downloads (model, API, page)
6. Jobs & Opportunities (model, API, page)
7. Projects & Partnerships (model, API, page)
8. Gallery (model, API, page)

**Phase 3 – CPD and member experience**
9. CPD page: filter events by CPD, calendar view, CPD points summary
10. Member portal: CPD points tracking, certificate download
11. Membership page: eligibility, benefits, renewal info
12. Home page: Chairperson message, announcements, CPD highlights, quick links

---

## Quick Reference: Routes to Add

| Route | Purpose |
|-------|---------|
| `/membership` | Membership info, eligibility, benefits, renewal |
| `/cpd` | CPD events, calendar, points info |
| `/resources` | Guidelines, publications, links |
| `/projects` | Projects & partnerships |
| `/gallery` | Photo/video galleries |
| `/jobs` | Jobs, internships, tenders |
| `/downloads` | Forms, reports, guidelines, constitution |

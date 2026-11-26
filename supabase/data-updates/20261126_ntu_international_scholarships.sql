-- Nottingham Trent University: India Postgraduate Award + NTU International Scholarships 2027-28
-- Adds the university row plus two scholarship records.
-- Verified against the official page on 2026-11-26:
-- https://www.ntu.ac.uk/international/scholarships
-- India Postgraduate Award: automatic GBP 2,000 for new Indian Masters students, applied
-- with the offer (no application). NTU International Scholarships: one application form
-- after an offer covers every competitive award (Excellence up to 50% of first-year fee,
-- Country & Regional GBP 4,000-5,000, Prestigious University Award up to GBP 4,000 incl.
-- India, Merit GBP 3,000, International GBP 2,000, UG Executive Dean's GBP 5,000).
-- Enrolment January 2027 or September 2027. Assessment dates 13 Jan 2027 and 31 Jan 2027;
-- final deadline 26 May 2027, 4pm GMT, for September 2027 entry. Awards do not stack:
-- only the higher award applies (exceptions: Sport Scholarship, Alumni discount within cap).
-- NOT auto-applied: run manually in the Supabase SQL editor after merge.
-- Apply-time check: this must insert exactly 1 university + 2 scholarships; it aborts
-- with an exception if any row already exists.

DO $$
BEGIN
 IF EXISTS (SELECT 1 FROM public.universities WHERE university_slug='nottingham-trent-university') THEN
 RAISE EXCEPTION 'nottingham-trent-university already exists - aborting';
 END IF;
 IF EXISTS (SELECT 1 FROM public.scholarships WHERE scholarship_slug LIKE 'nottingham-trent-university-%') THEN
 RAISE EXCEPTION 'an NTU scholarship already exists - aborting';
 END IF;

 INSERT INTO public.universities (id, university_slug, university_name, country_name, country_code, website_url, is_active)
 VALUES (gen_random_uuid(), 'nottingham-trent-university', 'Nottingham Trent University', 'United Kingdom', 'UK', 'https://www.ntu.ac.uk', true);

 INSERT INTO public.scholarships
 (id, scholarship_slug, university_id, university_name, country_name, country_code, scholarship_name,
 degree_level, amount_display, deadline_display, status, summary, eligibility, learn_more_url,
 is_active, last_verified_at, source_url)
 VALUES
 (gen_random_uuid(), 'nottingham-trent-university-india-postgraduate-award',
 (SELECT id FROM public.universities WHERE university_slug='nottingham-trent-university'),
 'Nottingham Trent University', 'United Kingdom', 'UK',
 'NTU India Postgraduate Award 2027-28', 'Postgraduate Taught',
 '£2,000 tuition fee reduction (automatic)',
 'No application needed; awarded automatically with the course offer for January 2027 or September 2027 entry', 'Active',
 'Automatic £2,000 award for new Masters students from India at Nottingham Trent University. No scholarship application is needed: the award is applied automatically when the student is made an offer for a place on one of NTU''s courses. It is a tuition fee reduction applied once the student enrols on the course.',
 'New Masters students from India who hold an offer of a place on an eligible NTU postgraduate taught course, are classed as overseas students for tuition fee purposes, and are due to enrol on the first year of a new course in January 2027 or September 2027. Excluded postgraduate courses: LLM BTC, LLM LPC, LLM (distance learning), MSc Human Resource Management (part-time), MA Social Work and MA Advanced Social Work Practice (with NHS funding), MSc Biomedical Science (flexible learning), SQE courses and all PGCE courses. Students whose tuition fees are sponsored, and Nottingham Trent International College (NTIC) progression students, are not eligible. If any other NTU scholarship, bursary or tuition fee reduction is awarded, only the higher award applies (not stackable, except a Sport Scholarship or the Alumni discount where the combined awards stay within 50% of the first-year fee).',
 'https://www.ntu.ac.uk/international/scholarships',
 true, now(), 'https://www.ntu.ac.uk/international/scholarships'),
 (gen_random_uuid(), 'nottingham-trent-university-international-scholarships',
 (SELECT id FROM public.universities WHERE university_slug='nottingham-trent-university'),
 'Nottingham Trent University', 'United Kingdom', 'UK',
 'NTU International Scholarships 2027-28', 'Undergraduate, Postgraduate Taught',
 '£2,000 up to 50% of the first-year tuition fee',
 'Assessment dates 13 January 2027 and 31 January 2027; final deadline 26 May 2027, 4pm GMT (September 2027 entry)', 'Active',
 'One scholarship application, made after receiving an NTU offer, is assessed for every international award the applicant is eligible for. Competitive awards include NTU Excellence Scholarships (up to 50% off the first-year fee; undergraduates also get £3,000 off each later year), Country and Regional Scholarships (£4,000 or £5,000 for outstanding Masters applicants), the Prestigious University Award (up to £4,000, open to applicants from India), NTU Merit Scholarship (£3,000), NTU International Scholarship (£2,000) and the Undergraduate Executive Dean''s Scholarship (£5,000, Bachelors only). Awards are tuition fee reductions applied on enrolment, and only the highest-value award applies (they do not stack).',
 'Applicants must hold an offer of a place on an eligible NTU course, be classed as international (overseas fee-paying) students, and be due to enrol on the first year of a new course in January 2027 or September 2027. One application per academic year per offer of a place. Higher-value awards need the full application form with a 500-word scholarship statement written by the applicant (AI-generated content is not accepted); merit-based awards need only personal details plus the box opting into consideration. NTU aims to give a decision within four weeks of application and informs applicants within five weeks of each deadline. Sponsored students, NTIC progression students and current NTU students cannot apply. Postgraduate exclusions: LLM BTC, LLM LPC, LLM (distance learning), MSc Human Resource Management (part-time), MA Social Work and MA Advanced Social Work Practice (with NHS funding), MSc Biomedical Science (flexible learning), SQE and PGCE courses. If any other NTU scholarship, bursary or tuition fee reduction is awarded, only the higher award applies (except a Sport Scholarship or the Alumni discount where the combined awards stay within 50% of the first-year fee).',
 'https://www.ntu.ac.uk/international/scholarships',
 true, now(), 'https://www.ntu.ac.uk/international/scholarships');
END $$;

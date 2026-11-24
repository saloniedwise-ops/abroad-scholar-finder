-- Dublin City University: International Scholarships for Non-EU Students 2027-28
-- Adds the university row plus four faculty scholarship records (non-EU applicants).
-- Verified against the official page on 2026-11-24:
-- https://www.dcu.ie/global/dcu-international-scholarships-non-eu-students-2027-28
-- All four: automatic consideration (no separate application), merit-based, fee reduction
-- applied to the student account, NOT stackable with any other DCU scholarship.
-- NOT auto-applied: run manually in the Supabase SQL editor after merge.
-- Apply-time check: this must insert exactly 1 university + 4 scholarships; it aborts
-- with an exception if any row already exists.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.universities WHERE university_slug='dublin-city-university') THEN
    RAISE EXCEPTION 'dublin-city-university already exists - aborting';
  END IF;
  IF EXISTS (SELECT 1 FROM public.scholarships WHERE scholarship_slug LIKE 'dublin-city-university-%') THEN
    RAISE EXCEPTION 'a DCU scholarship already exists - aborting';
  END IF;

  INSERT INTO public.universities (id, university_slug, university_name, country_name, country_code, website_url, is_active)
  VALUES (gen_random_uuid(), 'dublin-city-university', 'Dublin City University', 'Ireland', 'IE', 'https://www.dcu.ie', true);

  INSERT INTO public.scholarships
    (id, scholarship_slug, university_id, university_name, country_name, country_code, scholarship_name,
     degree_level, amount_display, deadline_display, status, summary, eligibility, learn_more_url,
     is_active, last_verified_at, source_url)
  VALUES
    (gen_random_uuid(), 'dublin-city-university-humanities-social-sciences-international-scholarship',
     (SELECT id FROM public.universities WHERE university_slug='dublin-city-university'),
     'Dublin City University', 'Ireland', 'IE',
     'DCU Humanities and Social Sciences International Scholarship 2027-28', 'Undergraduate, Postgraduate Taught',
     'EUR 2,000 (postgraduate); EUR 1,850 (undergraduate) fee reduction',
     'Automatic consideration with a Non-EU application; recipients notified by email', 'Active',
     'Merit-based fee reduction for high-achieving Non-EU applicants with an offer for a 2027-28 programme in the Faculty of Humanities and Social Sciences at Dublin City University. Automatically considered on application; the reduction is applied directly to the student account. Recipients of this scholarship are not considered for another DCU scholarship.',
     'Non-EU applicants with an offer for an eligible 2027-28 Faculty of Humanities and Social Sciences programme. Postgraduate (EUR 2,000): any postgraduate programme in the faculty. Undergraduate (EUR 1,850): DC155 BA in Applied Language and Translation Studies; DC009 Bachelor of Arts Joint Honours (Humanities); DC293 Bachelor of Arts Joint Honours (International Languages); DC292 Bachelor of Arts Joint Honours (Law); DC291 Bachelor of Arts Joint Honours (Media Studies); DC295 Bachelor of Arts Joint Honours (Politics); DC294 BA in Climate and Environmental Sustainability; DC238 BA in Social Sciences and Cultural Innovation; DC131 BA in Communication Studies; DC132 BA in Journalism; DC133 BSc in Multimedia; DC230 BA in Economics, Politics and Law; DC231 BA in International Relations; DC232 Bachelor of Civil Law; DC014 BA in Jazz and Contemporary Music Performance. Full-time study; not stackable with other DCU scholarships.',
     'https://www.dcu.ie/global/dcu-international-scholarships-non-eu-students-2027-28',
     true, now(), 'https://www.dcu.ie/global/dcu-international-scholarships-non-eu-students-2027-28'),
    (gen_random_uuid(), 'dublin-city-university-engineering-computing-international-scholarship',
     (SELECT id FROM public.universities WHERE university_slug='dublin-city-university'),
     'Dublin City University', 'Ireland', 'IE',
     'Faculty of Engineering and Computing International Scholarship 2027-28', 'Undergraduate, Postgraduate Taught',
     'EUR 4,400 (postgraduate); EUR 5,000 (undergraduate) fee reduction',
     'Automatic consideration with a Non-EU application; recipients notified by email', 'Active',
     'Fee reduction for Non-EU applicants with an offer for an eligible 2027-28 Masters or Bachelor programme in the Faculty of Engineering and Computing at Dublin City University. Automatically considered on application; the reduction is applied directly to the student account. Recipients of this scholarship are not considered for another DCU scholarship.',
     'Non-EU applicants with an offer for an eligible 2027-28 programme. Postgraduate (EUR 4,400): DC814 MEng in Mechanical and Manufacturing Engineering; DC836 MSc in Computing; DC883 MEng in Electronic and Computer Engineering; DC877 MSc in Electronic and Computer Technology. Undergraduate (EUR 5,000): DC200 Common Entry into Engineering; DC190 BEng in Electronic and Computer Engineering; DC193 BEng in Mechatronic Engineering; DC194 BEng in Mechanical and Sustainability Engineering; DC195 BEng in Mechanical and Manufacturing Engineering; DC197 BEng in Biomedical Engineering; DC120 BSc in Computing with Business; DC121 BSc in Computer Science; DC123 BSc in Data Science and Artificial Intelligence. Full-time study; not stackable with other DCU scholarships.',
     'https://www.dcu.ie/global/dcu-international-scholarships-non-eu-students-2027-28',
     true, now(), 'https://www.dcu.ie/global/dcu-international-scholarships-non-eu-students-2027-28'),
    (gen_random_uuid(), 'dublin-city-university-business-school-international-scholarship',
     (SELECT id FROM public.universities WHERE university_slug='dublin-city-university'),
     'Dublin City University', 'Ireland', 'IE',
     'DCU Business School International Scholarship 2027-28', 'Undergraduate, Postgraduate Taught',
     'EUR 2,000 (postgraduate); EUR 2,800 (undergraduate) fee reduction',
     'Automatic consideration with a Non-EU application; recipients notified by email', 'Active',
     'Fee reduction for Non-EU applicants with an offer for an eligible 2027-28 Masters or Bachelor programme in DCU Business School. Automatically considered on application; the reduction is applied directly to the student account. Recipients of this scholarship are not considered for another DCU scholarship.',
     'Non-EU applicants with an offer for an eligible 2027-28 programme. Postgraduate (EUR 2,000): DC632 MSc in Human Resource Management; DC526 MSc in International Accounting and Business; DC527 MSc in Global Management (Digital Disruption); DC501 MSc in Accounting; DC511 MSc in Finance; DC510 MSc in Management (Business); DC514 MSc in Management (Strategy); DC516 MSc in Digital Marketing; DC538 MSc in Business Analytics; DC537 MSc in Management (Operations and Supply Chain); DC540 MSc in Quantitative Economics for Business and Management. Undergraduate (EUR 2,800): DC110 Bachelor of Business Studies International; DC111 Bachelor of Business Studies; DC115 BA in Accounting and Finance; DC117 BSc in Aviation Management/Aviation Management with Pilot Studies; DC240 BSc in Marketing, Innovation and Technology; DC241 BSc in Digital Business and Innovation. Full-time study; not stackable with other DCU scholarships.',
     'https://www.dcu.ie/global/dcu-international-scholarships-non-eu-students-2027-28',
     true, now(), 'https://www.dcu.ie/global/dcu-international-scholarships-non-eu-students-2027-28'),
    (gen_random_uuid(), 'dublin-city-university-science-health-international-scholarship',
     (SELECT id FROM public.universities WHERE university_slug='dublin-city-university'),
     'Dublin City University', 'Ireland', 'IE',
     'Faculty of Science and Health International Scholarship 2027-28', 'Undergraduate, Postgraduate Taught',
     'EUR 4,500-5,000 (postgraduate); EUR 6,100 (undergraduate; EUR 3,100 for DC204) fee reduction',
     'Automatic consideration with a Non-EU application; recipients notified by email', 'Active',
     'Fee reduction for Non-EU applicants with an offer for an eligible 2027-28 Masters or Bachelor programme in the Faculty of Science and Health at Dublin City University. Automatically considered on application; the reduction is applied directly to the student account. Recipients of this scholarship are not considered for another DCU scholarship.',
     'Non-EU applicants with an offer for an eligible 2027-28 programme. Postgraduate: EUR 5,000 for DC739 MSc in Diagnostics and Precision Medicine, DC776 MSc in Biotherapeutics, DC734 MSc in Bioprocess Engineering, DC704 MSc in Financial Mathematics; EUR 4,500 for DC767 MSc in Psychology (Conversion) and DC765 MSc in Psychology and Wellbeing. Undergraduate (EUR 6,100 for successful applicants to the listed programmes, except DC204 at EUR 3,100): DC215 BSc in Nursing (General); DC216 BSc in Nursing (Mental Health); DC217 BSc in Nursing (Intellectual Disability); DC218 BSc in Children''s and General Nursing; DC163 Chemical Science General Entry; DC160 BSc in Chemistry with Artificial Intelligence; DC161 BSc in Analytical Science; DC162 BSc in Chemical and Pharmaceutical Science; DC126 BSc in Actuarial Mathematics; DC127 Common Entry, Actuarial, Financial Mathematics; DC166 BSc in Environmental Science and Technology; DC204 BSc in Athletic Therapy and Training (EUR 3,100); DC202 BSc Sport Science and Health; DC180 Biological Science General Entry; DC181 BSc in Biotechnology; DC168 BSc in Genetics and Cell Biology; DC209 BSc in Health and Society; DC208 BSc in Psychology; DC210 BSc in Psychology and Disruptive Technologies; DC207 BSc in Psychology and Mathematics; DC175 Physics General Entry. Full-time study; not stackable with other DCU scholarships.',
     'https://www.dcu.ie/global/dcu-international-scholarships-non-eu-students-2027-28',
     true, now(), 'https://www.dcu.ie/global/dcu-international-scholarships-non-eu-students-2027-28');
END $$;

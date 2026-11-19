-- Source URL refresh, November 2026
-- Replaces Google-search source URLs with verified official university scholarship pages.
-- Every URL below was re-verified on 2026-11-19 (HTTP 200 in browser or curl; pages are
-- scholarship listing/hub pages, not single-award pages, unless noted in the PR).
-- NOT auto-applied: run manually in the Supabase SQL editor after merge.
-- Apply-time check: this must update exactly 25 rows; abort and investigate otherwise.

UPDATE public.scholarship_sources
SET source_url = 'https://adelaide.edu.au/study/scholarships/',
    source_type = 'Official URL',
    last_status = NULL,
    monitor_enabled = true,
    is_active = true
WHERE university_name = 'ADELAIDE UNIVERSITY';

UPDATE public.scholarship_sources
SET source_url = 'https://bond.edu.au/international-scholarships-and-funding',
    source_type = 'Official URL',
    last_status = NULL,
    monitor_enabled = true,
    is_active = true
WHERE university_name = 'Bond University';

UPDATE public.scholarship_sources
SET source_url = 'https://www.cdu.edu.au/international/how-apply/scholarships',
    source_type = 'Official URL',
    last_status = NULL,
    monitor_enabled = true,
    is_active = true
WHERE university_name = 'Charles Darwin University';

UPDATE public.scholarship_sources
SET source_url = 'https://www.curtin.edu.au/study/scholarships/international-scholarships/',
    source_type = 'Official URL',
    last_status = NULL,
    monitor_enabled = true,
    is_active = true
WHERE university_name = 'Curtin University';

UPDATE public.scholarship_sources
SET source_url = 'https://www.ecu.edu.au/scholarships',
    source_type = 'Official URL',
    last_status = NULL,
    monitor_enabled = true,
    is_active = true
WHERE university_name = 'Edith Cowan University';

UPDATE public.scholarship_sources
SET source_url = 'https://www.eit.edu.au/how-to-apply/scholarships/',
    source_type = 'Official URL',
    last_status = NULL,
    monitor_enabled = true,
    is_active = true
WHERE university_name = 'Engineering Institute Of Technology';

UPDATE public.scholarship_sources
SET source_url = 'https://www.flinders.edu.au/scholarships',
    source_type = 'Official URL',
    last_status = NULL,
    monitor_enabled = true,
    is_active = true
WHERE university_name = 'Flinders University';

UPDATE public.scholarship_sources
SET source_url = 'https://www.griffith.ie/global/study-at-griffith/excellence-scholarships',
    source_type = 'Official URL',
    last_status = NULL,
    monitor_enabled = true,
    is_active = true
WHERE university_name = 'Griffith College';

UPDATE public.scholarship_sources
SET source_url = 'https://www.hw.ac.uk/study/fees-and-funding/scholarships-and-bursaries',
    source_type = 'Official URL',
    last_status = NULL,
    monitor_enabled = true,
    is_active = true
WHERE university_name = 'Heriot Watt University';

UPDATE public.scholarship_sources
SET source_url = 'https://www.cordonbleu.edu/brisbane/international-scholarships/en',
    source_type = 'Official URL',
    last_status = NULL,
    monitor_enabled = true,
    is_active = true
WHERE university_name = 'Le Cordon Bleu';

UPDATE public.scholarship_sources
SET source_url = 'https://www.lboro.ac.uk/study/undergraduate/fees-funding/scholarships/',
    source_type = 'Official URL',
    last_status = NULL,
    monitor_enabled = true,
    is_active = true
WHERE university_name = 'Loughborough University';

UPDATE public.scholarship_sources
SET source_url = 'https://www.mq.edu.au/study/admissions-and-entry/scholarships/international',
    source_type = 'Official URL',
    last_status = NULL,
    monitor_enabled = true,
    is_active = true
WHERE university_name = 'Macquarie University';

UPDATE public.scholarship_sources
SET source_url = 'https://www.mmu.ac.uk/international/scholarships-and-bursaries',
    source_type = 'Official URL',
    last_status = NULL,
    monitor_enabled = true,
    is_active = true
WHERE university_name = 'Manchester Metropolitan University';

UPDATE public.scholarship_sources
SET source_url = 'https://www.murdoch.edu.au/study/scholarships',
    source_type = 'Official URL',
    last_status = NULL,
    monitor_enabled = true,
    is_active = true
WHERE university_name = 'Murdoch University';

UPDATE public.scholarship_sources
SET source_url = 'https://www.qub.ac.uk/Study/international-students/international-scholarships/',
    source_type = 'Official URL',
    last_status = NULL,
    monitor_enabled = true,
    is_active = true
WHERE university_name = 'Queen’s University Belfast';

UPDATE public.scholarship_sources
SET source_url = 'https://www.rau.ac.uk/student-life/international-students/scholarships',
    source_type = 'Official URL',
    last_status = NULL,
    monitor_enabled = true,
    is_active = true
WHERE university_name = 'Royal Agricultural University';

UPDATE public.scholarship_sources
SET source_url = 'https://www.spjain.org/programs/postgraduate/scholarships',
    source_type = 'Official URL',
    last_status = NULL,
    monitor_enabled = true,
    is_active = true
WHERE university_name = 'S P Jain School Of Global Management';

UPDATE public.scholarship_sources
SET source_url = 'https://www.scu.edu.au/scholarships/',
    source_type = 'Official URL',
    last_status = NULL,
    monitor_enabled = true,
    is_active = true
WHERE university_name = 'Southern Cross University';

UPDATE public.scholarship_sources
SET source_url = 'https://www.unsw.edu.au/study/how-to-apply/scholarships',
    source_type = 'Official URL',
    last_status = NULL,
    monitor_enabled = true,
    is_active = true
WHERE university_name = 'The University Of New South Wales';

UPDATE public.scholarship_sources
SET source_url = 'https://www.uwa.edu.au/study/scholarships',
    source_type = 'Official URL',
    last_status = NULL,
    monitor_enabled = true,
    is_active = true
WHERE university_name = 'The University Of Western Australia';

UPDATE public.scholarship_sources
SET source_url = 'https://www.trinity.unimelb.edu.au/pathways-school/foundation-studies-scholarships',
    source_type = 'Official URL',
    last_status = NULL,
    monitor_enabled = true,
    is_active = true
WHERE university_name = 'Trinity College – University of Melbourne';

UPDATE public.scholarship_sources
SET source_url = 'https://www.uts.edu.au/for-students/admissions-entry/scholarships/international',
    source_type = 'Official URL',
    last_status = NULL,
    monitor_enabled = true,
    is_active = true
WHERE university_name = 'University Of Technology, Sydney';

UPDATE public.scholarship_sources
SET source_url = 'https://www.canberra.edu.au/scholarships/',
    source_type = 'Official URL',
    last_status = NULL,
    monitor_enabled = true,
    is_active = true
WHERE university_name = 'University of Canberra';

UPDATE public.scholarship_sources
SET source_url = 'https://www.strath.ac.uk/studywithus/undergraduate/undergraduatescholarships/',
    source_type = 'Official URL',
    last_status = NULL,
    monitor_enabled = true,
    is_active = true
WHERE university_name = 'University of Strathclyde';

UPDATE public.scholarship_sources
SET source_url = 'https://www.uow.edu.au/study/scholarships/',
    source_type = 'Official URL',
    last_status = NULL,
    monitor_enabled = true,
    is_active = true
WHERE university_name = 'University of Wollongong';

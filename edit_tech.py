import re
import os

with open("tech.md", "r", encoding="utf-8") as f:
    text = f.read()

# REMOVE BAD SECTIONS
text = re.sub(r'### 5\.10 Exam Module.*?---', '', text, flags=re.DOTALL)
text = re.sub(r'### 5\.12 Placements Module.*?---', '', text, flags=re.DOTALL)
text = re.sub(r'### 5\.14 Code Arena Module.*?---', '', text, flags=re.DOTALL)
text = re.sub(r'### 5\.15 Skill Courses Module.*?---', '', text, flags=re.DOTALL)
text = re.sub(r'### 5\.18 Groups Module \\(.*?\\) — NEW.*?## 6\.', '## 6.', text, flags=re.DOTALL)

# REMOVE BAD ROUTES AND IMPORTS FROM DIAGRAMS
lines = text.split('\n')
clean_lines = []
for line in lines:
    if any(kw in line for kw in ['CodeArena', 'CodeProblem', 'CodeSubmission', 'CodeStreak', 
                                 'Contest', 'SkillCourse', 'Placements', 'PlacementDrive', 
                                 'Exam', 'ExamSession', 'AnswerScript', 'EvaluationTask', 
                                 'Marks', 'Group', 'Groups', 'Webhooks', 'AdminBot']):
        # If the line is an architecture diagram line containing these words, skip or replace
        pass
    else:
        clean_lines.append(line)

new_text = '\n'.join(clean_lines)

with open("tech_edited.md", "w", encoding="utf-8") as f:
    f.write(new_text)

os.replace("report_edited.md", "report.md")
os.replace("tech_edited.md", "tech.md")

from ade import *
from computation import *
from static_data import Q1, Q2, Q3
from ics import Calendar
from time import time
import library
from itertools import chain

codes = ['LELEC1310', 'LELEC1360', 'LINMA1510', 'LMECA1321', 'LMECA1100', 'LFSAB1508']
codes_master = ['LELEC2660', 'LELEC2811', 'LMECA2755', 'LELEC2313', 'LELEC2531', 'LMECA2801', 'LELME2002']
codes_info = ['lelec2531', 'lingi2241', 'lingi2255', 'lingi2261', 'lingi2266', 'lfsab2351']
codes_q5 = ['langl1873', 'lelec1530', 'lelec1755', 'lepl2351', 'lfsab1105', 'lmeca1451', 'lmeca1855', 'lmeca1901']
codes_celine = ['lkine2108','LTECO1004','lkine2127','lkine2138','lkine2148','lkine2158','lkine2168','LIEPR2236']
anglais3 = ['langl1873'] # Q1
anglais2 = ['langl1872'] # Q1 # cela bug.. . ???


cal = Calendar()

# projectID: 2 pour 18-19 ou 9 pour 19-20
c = getCoursesFromCodes(anglais3, Q1, 9)

"""
for course in c:
        print(course.name, course.getSummary(weeks=range(34,53)))
"""

years, scores = parallel_compute(c)
i = 0
events = list(event for week in years[0] for event in week)

library.clearLibrary()
settings = library.settingsFromEvents(events)
print('settings', settings)
library.addSettings(settings)

f = library.getCalendar(0)

# for week in range(53):
#     best, score = compute(c, week)
#     if score > 0:
#         print('Probleme avec la semaine numero '+str(week)+', score de: '+str(score))
#     for event in best:
#         cal.events.add(event)

"""
with open('my.ics', 'w') as f:
    f.writelines(cal)"""

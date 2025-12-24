/* =========================================
   SCORM Handling - מותאם לסקר (ללא ציון)
   קובץ זה אחראי על התקשורת עם מערכת ה-LMS
   ========================================= */

// משתנה גלובלי לאובייקט SCORM
var scorm = null;

// משתנה בוליאני לציון האם החיבור ל-LMS הצליח
var isScormConnected = false;

// פונקציה: בדיקה האם עטיפת SCORM קיימת בדפדפן
// מונעת קריסה בהרצה מקומית / GitHub
function isScormAvailable() {
    return (window.pipwerks && pipwerks.SCORM);
}

// פונקציה: שליחת נתוני הסקר ל-LMS
// מדווחת אינטראקציות (questions) למערכת SCORM
function sendSurveyToLMS(workField, preferredJob, experienceLevel, hasExperience, additionalComments) {

    // אם אין SCORM זמין או אין חיבור פעיל - לא שולחים נתונים
    if (!isScormAvailable() || !isScormConnected) {
        console.log('SCORM not available or not connected - skipping LMS send');
        return false;
    }

    // קבלת מספר האינטראקציות הקיים 
    var interactionCount = scorm.get('cmi.interactions._count');
    var nextIndex = 0;

    // המרה למספר תקין
    if (interactionCount !== null && interactionCount !== undefined && interactionCount !== '') {
        nextIndex = parseInt(interactionCount, 10);
        if (isNaN(nextIndex)) {
            nextIndex = 0;
        }
    }

    // אינטראקציה 1 - תחום עבודה
    scorm.set('cmi.interactions.' + nextIndex + '.id', 'Q1_work_field');
    scorm.set('cmi.interactions.' + nextIndex + '.type', 'choice');
    scorm.set('cmi.interactions.' + nextIndex + '.student_response', workField);
    scorm.set('cmi.interactions.' + nextIndex + '.result', 'neutral');
    nextIndex = nextIndex + 1;

    // אינטראקציה 2 - תפקיד מועדף
    scorm.set('cmi.interactions.' + nextIndex + '.id', 'Q2_preferred_job');
    scorm.set('cmi.interactions.' + nextIndex + '.type', 'choice');
    scorm.set('cmi.interactions.' + nextIndex + '.student_response', preferredJob);
    scorm.set('cmi.interactions.' + nextIndex + '.result', 'neutral');
    nextIndex = nextIndex + 1;

    // אינטראקציה 3 - רמת ניסיון
    scorm.set('cmi.interactions.' + nextIndex + '.id', 'Q3_experience_level');
    scorm.set('cmi.interactions.' + nextIndex + '.type', 'choice');
    scorm.set('cmi.interactions.' + nextIndex + '.student_response', experienceLevel);
    scorm.set('cmi.interactions.' + nextIndex + '.result', 'neutral');
    nextIndex = nextIndex + 1;

    // אינטראקציה 4 - האם יש ניסיון
    scorm.set('cmi.interactions.' + nextIndex + '.id', 'Q4_has_experience');
    scorm.set('cmi.interactions.' + nextIndex + '.type', 'choice');
    scorm.set('cmi.interactions.' + nextIndex + '.student_response', hasExperience);
    scorm.set('cmi.interactions.' + nextIndex + '.result', 'neutral');
    nextIndex = nextIndex + 1;

    // אינטראקציה 5 - הערות חופשיות (טקסט)
    var commentsToSend = additionalComments;
    if (commentsToSend === null || commentsToSend === undefined || commentsToSend === '') {
        commentsToSend = 'none';
    }

    scorm.set('cmi.interactions.' + nextIndex + '.id', 'Q5_additional_comments');
    scorm.set('cmi.interactions.' + nextIndex + '.type', 'fill-in');
    scorm.set('cmi.interactions.' + nextIndex + '.student_response', commentsToSend);
    scorm.set('cmi.interactions.' + nextIndex + '.result', 'neutral');

    // בסקר: סימון הפעילות כהושלמה (ללא ציון)
    scorm.set('cmi.core.lesson_status', 'completed');

    // שמירת הנתונים במערכת ה-LMS
    scorm.save();
    return true;
}
// אתחול SCORM בעת טעינת העמוד
document.addEventListener('DOMContentLoaded', function() {

    // בדיקה שהסקרום קיים
    if (!isScormAvailable()) {
        console.log('SCORM wrapper not found - running in standalone mode');
        return;
    }

    // קבלת אובייקט SCORM
    scorm = pipwerks.SCORM;

    // ניסיון אתחול חיבור ל-LMS
    isScormConnected = scorm.init();

    if (isScormConnected) {
        console.log('SCORM initialized successfully');

        // שליפת שם הלומד (מידע כללי מה-LMS)
        var learnerName = scorm.get('cmi.core.student_name');
        if (learnerName) {
            var nameElement = document.getElementById('learner-name');
            if (nameElement) {
                nameElement.textContent = learnerName;
            }
        }

        // בדיקה האם זו כניסה ראשונה לפעילות
        var status = scorm.get('cmi.core.lesson_status');
        if (status === 'not attempted') {
            scorm.set('cmi.core.lesson_status', 'incomplete');
            scorm.save();
        }

        // שמירה וניתוק בעת סגירת העמוד
        window.addEventListener('beforeunload', function() {
            scorm.save();
            scorm.quit();
        });

    } else {
        console.log('SCORM API not found - running in standalone mode');
    }
});

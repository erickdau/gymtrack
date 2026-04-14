function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  if (data.type === 'exercise') {
    var sheet = ss.getSheetByName('Exercises');
    if (!sheet) {
      sheet = ss.insertSheet('Exercises');
      sheet.appendRow(['date','day','exercise','sets','reps','gym','weight_raw','weight_type','rest_durations','avg_rest_s','max_rest_s']);
    }
    data.rows.forEach(function(row) {
      sheet.appendRow([
        row.date, row.day, row.exercise, row.sets, row.reps,
        row.gym, row.weight_raw, row.weight_type,
        row.rest_durations.join(','), row.avg_rest_s, row.max_rest_s
      ]);
    });
  }

  if (data.type === 'session') {
    var sSheet = ss.getSheetByName('Sessions');
    if (!sSheet) {
      sSheet = ss.insertSheet('Sessions');
      sSheet.appendRow(['date','day','gym','total_workout_time_s','exercises_completed']);
    }
    sSheet.appendRow([data.date, data.day, data.gym, data.total_workout_time_s, data.exercises_completed]);
  }

  if (data.type === 'skipped') {
    var kSheet = ss.getSheetByName('Skipped');
    if (!kSheet) {
      kSheet = ss.insertSheet('Skipped');
      kSheet.appendRow(['date', 'day_skipped']);
    }
    kSheet.appendRow([data.date, data.day_skipped || '']);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}

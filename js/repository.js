/* global DatabaseConnection */
/* exported SurveyRepository */

class SurveyRepository {
  constructor() {
    this.db = DatabaseConnection.getInstance().getClient();
  }

  async saveSurvey(datos) {
    const { error } = await this.db.from('encuestas').insert([datos]);
    if (error) throw error;
  }

  async getAllSurveys() {
    const { data, error } = await this.db
      .from('encuestas')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }
}

window.SurveyRepository = SurveyRepository;

const { promedio, pctSi, badgeClass } = require('../js/resultados.js');

global.document = {
  getElementById: jest.fn(() => ({
    getContext: jest.fn(),
    textContent: ''
  })),
  querySelectorAll: jest.fn(() => []),
  createElement: jest.fn(() => ({
    appendChild: jest.fn(),
    style: {}
  })),
  querySelector: jest.fn(() => ({
    replaceChildren: jest.fn(),
    appendChild: jest.fn()
  }))
};
global.Chart = jest.fn();
global.SurveyRepository = jest.fn(() => ({
  getAllSurveys: jest.fn(() => Promise.resolve([]))
}));


describe('Pruebas Unitarias de resultados.js', () => {

  describe('Función: promedio()', () => {
    test('Debe calcular el promedio correcto con números válidos', () => {
      expect(promedio([10, 8])).toBe(9);
      expect(promedio([5, 5, 5])).toBe(5);
    });

    test('Debe ignorar valores nulos o caracteres inválidos', () => {
      //Ignora el null y el string 'hola', promedia solo [10, 8]
      expect(promedio([10, null, 8, 'hola'])).toBe(9);
    });

    test('Debe devolver 0 si recibe un arreglo vacío', () => {
      expect(promedio([])).toBe(0);
    });

    test('Debe devolver 0 si recibe un arreglo con solo valores inválidos', () => {
      expect(promedio([null, undefined, 'texto'])).toBe(0);
    });
  });

  describe('Función: pctSi()', () => {
    test('Debe calcular correctamente el porcentaje de respuestas "Sí"', () => {
      expect(pctSi(['Sí', 'No', 'Sí', 'Sí'])).toBe(75);
      expect(pctSi(['Sí', 'Sí'])).toBe(100);
      expect(pctSi(['No', 'No'])).toBe(0);
    });

    test('Debe ignorar valores nulos para el cálculo', () => {
      //1 Sí, 1 No, y 1 nulo. El porcentaje debe ser sobre 2 (50%)
      expect(pctSi(['Sí', 'No', null])).toBe(50);
    });

    test('Debe devolver null si el arreglo está vacío o solo tiene valores nulos', () => {
      expect(pctSi([])).toBeNull();
      expect(pctSi([null, null])).toBeNull();
    });
  });

  describe('Función: badgeClass()', () => {
    test('Debe clasificar promedios menores o iguales a 4 como "low"', () => {
      expect(badgeClass(2)).toBe('low');
      expect(badgeClass(4)).toBe('low');
    });

    test('Debe clasificar promedios entre 4 y 7 como "mid"', () => {
      expect(badgeClass(5)).toBe('mid');
      expect(badgeClass(7)).toBe('mid');
    });

    test('Debe clasificar promedios mayores a 7 como "high"', () => {
      expect(badgeClass(8)).toBe('high');
      expect(badgeClass(10)).toBe('high');
    });
  });

});

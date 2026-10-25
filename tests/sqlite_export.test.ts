import { describe, it, expect } from 'vitest';
import { exportSqlResultToCsv, exportSqlResultToJson, SqlQueryResult } from '../src/opfs/sqlite_runner';

describe('SQLite Query Result Exporter', () => {
  const sampleResult: SqlQueryResult = {
    columns: ['id', 'name', 'balance', 'metadata'],
    values: [
      [1, 'Alice Smith', 1500.5, '{"active": true}'],
      [2, 'Bob "The Builder"', 320.0, '{"role": "admin"}'],
      [3, null, null, null],
    ],
    executionTimeMs: 1.45,
    rowCount: 3,
  };

  it('exports SQL query result to CSV correctly with escaped quotes', () => {
    const csv = exportSqlResultToCsv(sampleResult);
    expect(csv).toContain('"id","name","balance","metadata"');
    expect(csv).toContain('"1","Alice Smith","1500.5","{""active"": true}"');
    expect(csv).toContain('"2","Bob ""The Builder""","320","{""role"": ""admin""}"');
    expect(csv).toContain('"3","","",""');
  });

  it('exports SQL query result to structured JSON', () => {
    const jsonStr = exportSqlResultToJson(sampleResult);
    const parsed = JSON.parse(jsonStr);

    expect(parsed).toHaveLength(3);
    expect(parsed[0].id).toBe(1);
    expect(parsed[0].name).toBe('Alice Smith');
    expect(parsed[0].balance).toBe(1500.5);
    expect(parsed[1].name).toBe('Bob "The Builder"');
    expect(parsed[2].name).toBeNull();
  });

  it('handles empty results cleanly', () => {
    const emptyResult: SqlQueryResult = {
      columns: [],
      values: [],
      executionTimeMs: 0.1,
      rowCount: 0,
    };

    expect(exportSqlResultToCsv(emptyResult)).toBe('');
    expect(exportSqlResultToJson(emptyResult)).toBe('[]');
  });
});

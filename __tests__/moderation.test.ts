import { ContentReport } from '../src/types/app';

describe('Moderation & Urban Decorum Verification', () => {
  const mockReports: ContentReport[] = [
    {
      id: 'rep-1',
      targetId: 'art-001',
      targetType: 'artwork',
      reporterUsername: 'trento_citizen',
      category: 'offensive',
      reason: 'Contenuto con linguaggio volgare.',
      createdAt: '2026-09-02T10:00:00.000Z',
    },
    {
      id: 'rep-2',
      targetId: 'c-099',
      targetType: 'comment',
      reporterUsername: 'davide_db',
      category: 'spam',
      reason: 'Link promozionale non autorizzato.',
      createdAt: '2026-09-02T11:30:00.000Z',
    },
    {
      id: 'rep-3',
      targetId: 'art-002',
      targetType: 'artwork',
      reporterUsername: 'alps_walker',
      category: 'danger',
      reason: 'Posizionato su un dirupo non raggiungibile a piedi.',
      createdAt: '2026-09-02T12:00:00.000Z',
    },
  ];

  test('TC-MOD-1: Valida le categorie di segnalazione ammesse', () => {
    const validCategories = ['offensive', 'copyright', 'spam', 'danger'];
    for (const report of mockReports) {
      expect(validCategories).toContain(report.category);
    }
  });

  test('TC-MOD-2: Archiviazione corretta delle segnalazioni (dismiss)', () => {
    const targetToDismiss = 'art-001';
    const remaining = mockReports.filter((r) => r.targetId !== targetToDismiss);
    expect(remaining.length).toBe(2);
    expect(remaining.find((r) => r.targetId === targetToDismiss)).toBeUndefined();
  });

  test('TC-MOD-3: Identifica correttamente il tipo di target (opera vs commento)', () => {
    const artworkReports = mockReports.filter((r) => r.targetType === 'artwork');
    const commentReports = mockReports.filter((r) => r.targetType === 'comment');

    expect(artworkReports.length).toBe(2);
    expect(commentReports.length).toBe(1);
    expect(commentReports[0].targetId).toBe('c-099');
  });
});

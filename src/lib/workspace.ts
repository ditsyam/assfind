import { JournalEntry, WorkspaceExportResult, WorkspaceFileItem } from '../types';

export const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/documents.readonly',
  'https://www.googleapis.com/auth/presentations',
  'https://www.googleapis.com/auth/presentations.readonly',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
];

/**
 * Creates a formatted Google Doc from a ReflectAI Journal Entry.
 */
export async function exportJournalToGoogleDoc(
  entry: JournalEntry,
  accessToken: string
): Promise<WorkspaceExportResult> {
  if (!accessToken) {
    throw new Error('Access token is missing. Please sign in with Google to enable Docs export.');
  }

  const docTitle = `ReflectAI - ${entry.title || 'Journal Reflection'} (${new Date(entry.createdAt).toLocaleDateString()})`;

  // Step 1: Create a new empty Google Doc via Docs API
  const createRes = await fetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: docTitle,
    }),
  });

  if (!createRes.ok) {
    const errJson = await createRes.json().catch(() => ({}));
    throw new Error(
      errJson.error?.message || `Failed to create Google Doc (Status: ${createRes.status})`
    );
  }

  const createdDoc = await createRes.json();
  const documentId = createdDoc.documentId;

  // Step 2: Build formatted text content to insert
  let bodyText = `\nReflectAI Reflection: ${entry.title}\n`;
  bodyText += `Date: ${new Date(entry.createdAt).toLocaleString()}\n`;
  bodyText += `Mood: ${entry.mood || 'Contemplative'} | Sentiment Score: ${entry.sentimentScore !== undefined ? `${entry.sentimentScore}/10` : 'N/A'}\n`;
  if (entry.location) {
    bodyText += `Location: ${entry.location.placeName || 'Saved Geo Point'} (${entry.location.address || ''})\n`;
  }
  if (entry.tags && entry.tags.length > 0) {
    bodyText += `Tags: ${entry.tags.join(', ')}\n`;
  }
  bodyText += `\n------------------------------------------------------------\n\n`;

  bodyText += `EXECUTIVE SUMMARY\n${entry.summary || 'No summary generated.'}\n\n`;

  if (entry.keyTakeaways && entry.keyTakeaways.length > 0) {
    bodyText += `KEY INSIGHTS & TAKEAWAYS\n`;
    entry.keyTakeaways.forEach((k) => {
      bodyText += `• ${k}\n`;
    });
    bodyText += `\n`;
  }

  if (entry.actionItems && entry.actionItems.length > 0) {
    bodyText += `ACTIONABLE NEXT STEPS\n`;
    entry.actionItems.forEach((a) => {
      bodyText += `[ ] ${a}\n`;
    });
    bodyText += `\n`;
  }

  if (entry.messages && entry.messages.length > 0) {
    bodyText += `REFLECTION LOG\n`;
    entry.messages.forEach((m) => {
      const author = m.role === 'user' ? 'Reflector' : 'ReflectAI Guide';
      bodyText += `[${new Date(m.timestamp).toLocaleTimeString()}] ${author}:\n${m.content}\n\n`;
    });
  }

  bodyText += `\n---\nSynthesized securely by ReflectAI with Cloud Firestore & Gemini AI.\n`;

  // Step 3: Populate the document via Docs BatchUpdate
  const updateRes = await fetch(
    `https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            insertText: {
              location: {
                index: 1,
              },
              text: bodyText,
            },
          },
        ],
      }),
    }
  );

  if (!updateRes.ok) {
    console.warn('Batch update note on Google Doc:', await updateRes.text());
  }

  const webViewLink = `https://docs.google.com/document/d/${documentId}/edit`;

  return {
    fileId: documentId,
    fileName: docTitle,
    webViewLink,
    type: 'doc',
    exportedAt: Date.now(),
  };
}

/**
 * Creates a multi-slide presentation in Google Slides from a ReflectAI Journal Entry.
 */
export async function exportJournalToGoogleSlides(
  entry: JournalEntry,
  accessToken: string
): Promise<WorkspaceExportResult> {
  if (!accessToken) {
    throw new Error('Access token is missing. Please sign in with Google to enable Slides export.');
  }

  const presentationTitle = `ReflectAI Deck - ${entry.title || 'Journal Reflection'} (${new Date(entry.createdAt).toLocaleDateString()})`;

  // Step 1: Create a presentation via Slides API
  const createRes = await fetch('https://slides.googleapis.com/v1/presentations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: presentationTitle,
    }),
  });

  if (!createRes.ok) {
    const errJson = await createRes.json().catch(() => ({}));
    throw new Error(
      errJson.error?.message || `Failed to create Google Slides presentation (Status: ${createRes.status})`
    );
  }

  const createdPresentation = await createRes.json();
  const presentationId = createdPresentation.presentationId;

  // Step 2: Add slides and structured text boxes using BatchUpdate
  const slide1Id = 'slide_summary_' + Math.random().toString(36).substring(2, 7);
  const slide2Id = 'slide_insights_' + Math.random().toString(36).substring(2, 7);
  const slide3Id = 'slide_actions_' + Math.random().toString(36).substring(2, 7);

  const textBox1Id = 'tb1_' + Math.random().toString(36).substring(2, 7);
  const textBox2Id = 'tb2_' + Math.random().toString(36).substring(2, 7);
  const textBox3Id = 'tb3_' + Math.random().toString(36).substring(2, 7);

  const requests: any[] = [
    // Create Slide 1: Executive Summary
    {
      createSlide: {
        objectId: slide1Id,
        insertionIndex: 1,
        slideLayoutReference: {
          predefinedLayout: 'TITLE_AND_BODY',
        },
      },
    },
    // Create Slide 2: Key Takeaways
    {
      createSlide: {
        objectId: slide2Id,
        insertionIndex: 2,
        slideLayoutReference: {
          predefinedLayout: 'TITLE_AND_BODY',
        },
      },
    },
    // Create Slide 3: Action Items
    {
      createSlide: {
        objectId: slide3Id,
        insertionIndex: 3,
        slideLayoutReference: {
          predefinedLayout: 'TITLE_AND_BODY',
        },
      },
    },
    // Add text box to Slide 1
    {
      createShape: {
        objectId: textBox1Id,
        shapeType: 'TEXT_BOX',
        elementProperties: {
          pageObjectId: slide1Id,
          size: { width: { magnitude: 600, unit: 'PT' }, height: { magnitude: 300, unit: 'PT' } },
          transform: { scaleX: 1, scaleY: 1, translateX: 50, translateY: 60, unit: 'PT' },
        },
      },
    },
    {
      insertText: {
        objectId: textBox1Id,
        text: `Executive Reflection & Synthesis\n\nMood: ${entry.mood || 'Contemplative'} | Sentiment: ${entry.sentimentScore !== undefined ? `${entry.sentimentScore}/10` : 'N/A'}\nDate: ${new Date(entry.createdAt).toLocaleDateString()}\n\n${entry.summary || 'Summary generated by ReflectAI AI.'}`,
      },
    },
    // Add text box to Slide 2
    {
      createShape: {
        objectId: textBox2Id,
        shapeType: 'TEXT_BOX',
        elementProperties: {
          pageObjectId: slide2Id,
          size: { width: { magnitude: 600, unit: 'PT' }, height: { magnitude: 300, unit: 'PT' } },
          transform: { scaleX: 1, scaleY: 1, translateX: 50, translateY: 60, unit: 'PT' },
        },
      },
    },
    {
      insertText: {
        objectId: textBox2Id,
        text: `Key Insights & Emotional Resonance\n\n${(entry.keyTakeaways || ['Continuous growth and self-discovery.', 'Reflective clarity established.']).map((k) => `• ${k}`).join('\n')}`,
      },
    },
    // Add text box to Slide 3
    {
      createShape: {
        objectId: textBox3Id,
        shapeType: 'TEXT_BOX',
        elementProperties: {
          pageObjectId: slide3Id,
          size: { width: { magnitude: 600, unit: 'PT' }, height: { magnitude: 300, unit: 'PT' } },
          transform: { scaleX: 1, scaleY: 1, translateX: 50, translateY: 60, unit: 'PT' },
        },
      },
    },
    {
      insertText: {
        objectId: textBox3Id,
        text: `Action Plan & Follow-ups\n\n${(entry.actionItems || ['Review reflection goals weekly', 'Maintain mindful pause routines']).map((a) => `[ ] ${a}`).join('\n')}`,
      },
    },
  ];

  const updateRes = await fetch(
    `https://slides.googleapis.com/v1/presentations/${presentationId}:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests }),
    }
  );

  if (!updateRes.ok) {
    console.warn('Batch update note on Google Slides:', await updateRes.text());
  }

  const webViewLink = `https://docs.google.com/presentation/d/${presentationId}/edit`;

  return {
    fileId: presentationId,
    fileName: presentationTitle,
    webViewLink,
    type: 'slides',
    exportedAt: Date.now(),
  };
}

/**
 * Fetch Google Docs files from the user's Google Drive.
 */
export async function listGoogleDocs(accessToken: string): Promise<WorkspaceFileItem[]> {
  if (!accessToken) return [];

  const queryParam = encodeURIComponent(
    "mimeType='application/vnd.google-apps.document' and trashed=false"
  );
  const url = `https://www.googleapis.com/drive/v3/files?q=${queryParam}&fields=files(id,name,mimeType,webViewLink,iconLink,modifiedTime)&orderBy=modifiedTime desc&pageSize=15`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to list Google Docs (Status: ${res.status})`);
  }

  const data = await res.json();
  return data.files || [];
}

/**
 * Fetch Google Slides presentations from the user's Google Drive.
 */
export async function listGoogleSlides(accessToken: string): Promise<WorkspaceFileItem[]> {
  if (!accessToken) return [];

  const queryParam = encodeURIComponent(
    "mimeType='application/vnd.google-apps.presentation' and trashed=false"
  );
  const url = `https://www.googleapis.com/drive/v3/files?q=${queryParam}&fields=files(id,name,mimeType,webViewLink,iconLink,modifiedTime)&orderBy=modifiedTime desc&pageSize=15`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to list Google Slides (Status: ${res.status})`);
  }

  const data = await res.json();
  return data.files || [];
}

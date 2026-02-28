import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AIServiceConfig,
  AICompactDiagram,
  AI_PRESETS,
  loadAIConfig,
  saveAIConfig,
  generateDiagramWithAI,
  AVAILABLE_ICONS
} from '../services/aiService';
import {
  convertAIDiagramToFossFLOW,
  generateDiagramSummary
} from '../services/aiDiagramConverter';
import { DiagramData } from '../diagramUtils';

interface AIGenerateDialogProps {
  onGenerate: (diagramData: DiagramData) => void;
  existingIcons: any[];
  onClose: () => void;
}

type Tab = 'generate' | 'settings' | 'schema';

export function AIGenerateDialog({
  onGenerate,
  existingIcons,
  onClose
}: AIGenerateDialogProps) {
  const { t, i18n } = useTranslation('app');

  // Tabs
  const [activeTab, setActiveTab] = useState<Tab>('generate');

  // AI Config
  const [provider, setProvider] = useState<string>(() => {
    const savedProvider = localStorage.getItem('fossflow-ai-provider');
    if (savedProvider) return savedProvider;
    // If env config is set, default to 'custom'
    if (process.env.AI_API_ENDPOINT) return 'custom';
    return 'openai';
  });
  const [config, setConfig] = useState<AIServiceConfig>(() => {
    const saved = loadAIConfig();
    return (
      saved || {
        apiEndpoint:
          AI_PRESETS.openai.apiEndpoint ||
          'https://api.openai.com/v1/chat/completions',
        apiKey: '',
        model: AI_PRESETS.openai.model || 'gpt-4o',
        temperature: 0.7,
        maxTokens: 4096
      }
    );
  });

  // Generation state
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedDiagram, setGeneratedDiagram] =
    useState<AICompactDiagram | null>(null);
  const [preview, setPreview] = useState<string>('');

  // JSON editor state
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Update config when provider changes
  const handleProviderChange = (newProvider: string) => {
    setProvider(newProvider);
    localStorage.setItem('fossflow-ai-provider', newProvider);

    const preset = AI_PRESETS[newProvider];
    if (preset) {
      setConfig((prev) => ({
        ...prev,
        apiEndpoint: preset.apiEndpoint || prev.apiEndpoint,
        model: preset.model || prev.model,
        temperature: preset.temperature ?? prev.temperature,
        maxTokens: preset.maxTokens ?? prev.maxTokens
      }));
    }
  };

  // Save config whenever it changes
  const handleConfigChange = useCallback(
    (updates: Partial<AIServiceConfig>) => {
      setConfig((prev) => {
        const updated = { ...prev, ...updates };
        saveAIConfig(updated);
        return updated;
      });
    },
    []
  );

  // Generate diagram via AI
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError(t('ai.errorEmptyPrompt'));
      return;
    }

    if (!config.apiKey && provider !== 'ollama') {
      setError(t('ai.errorNoApiKey'));
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedDiagram(null);
    setPreview('');

    try {
      const diagram = await generateDiagramWithAI(prompt, config, i18n.language);
      setGeneratedDiagram(diagram);
      setPreview(generateDiagramSummary(diagram));
      setJsonInput(JSON.stringify(diagram, null, 2));
    } catch (err: any) {
      setError(err.message || t('ai.errorGeneration'));
    } finally {
      setIsGenerating(false);
    }
  };

  // Apply JSON input (manual or AI-generated)
  const handleApplyJSON = () => {
    try {
      const parsed: AICompactDiagram = JSON.parse(jsonInput);
      const diagramData = convertAIDiagramToFossFLOW(parsed, existingIcons);
      onGenerate(diagramData);
    } catch (err: any) {
      setJsonError(err.message || 'Invalid JSON');
    }
  };

  // Apply AI-generated diagram
  const handleApplyGenerated = () => {
    if (!generatedDiagram) return;
    const diagramData = convertAIDiagramToFossFLOW(
      generatedDiagram,
      existingIcons
    );
    onGenerate(diagramData);
  };

  // Example prompts
  const examplePrompts = [
    t('ai.example1'),
    t('ai.example2'),
    t('ai.example3'),
    t('ai.example4')
  ];

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div
        className="dialog"
        style={{ minWidth: '700px', maxWidth: '900px', maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}
        >
          <h2 style={{ margin: 0 }}>🤖 {t('ai.title')}</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '4px 8px'
            }}
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            borderBottom: '2px solid #e0e0e0',
            marginBottom: '16px'
          }}
        >
          {(
            [
              { key: 'generate', label: `✨ ${t('ai.tabGenerate')}` },
              { key: 'schema', label: `📋 ${t('ai.tabJSON')}` },
              { key: 'settings', label: `⚙️ ${t('ai.tabSettings')}` }
            ] as { key: Tab; label: string }[]
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderBottom:
                  activeTab === tab.key
                    ? '3px solid #007bff'
                    : '3px solid transparent',
                background: 'none',
                fontWeight: activeTab === tab.key ? 'bold' : 'normal',
                color: activeTab === tab.key ? '#007bff' : '#666',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ overflow: 'auto', maxHeight: 'calc(90vh - 180px)' }}>
          {/* Generate Tab */}
          {activeTab === 'generate' && (
            <div>
              {/* Prompt Input */}
              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    fontWeight: 'bold',
                    marginBottom: '8px'
                  }}
                >
                  {t('ai.promptLabel')}
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={t('ai.promptPlaceholder')}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '14px',
                    borderRadius: '8px',
                    border: '1px solid #ddd',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                  disabled={isGenerating}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      handleGenerate();
                    }
                  }}
                />
                <small style={{ color: '#888' }}>
                  {t('ai.promptHint')}
                </small>
              </div>

              {/* Example Prompts */}
              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    color: '#888',
                    marginBottom: '6px'
                  }}
                >
                  {t('ai.examples')}
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {examplePrompts.map((ex, i) => (
                    <button
                      key={i}
                      onClick={() => setPrompt(ex)}
                      style={{
                        padding: '4px 10px',
                        fontSize: '12px',
                        border: '1px solid #ddd',
                        borderRadius: '16px',
                        background: '#f8f9fa',
                        cursor: 'pointer',
                        color: '#555'
                      }}
                    >
                      {ex.length > 40 ? ex.slice(0, 40) + '...' : ex}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <div style={{ marginBottom: '16px' }}>
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  style={{
                    padding: '12px 24px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    backgroundColor: isGenerating ? '#6c757d' : '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: isGenerating ? 'wait' : 'pointer',
                    width: '100%'
                  }}
                >
                  {isGenerating ? (
                    <>⏳ {t('ai.generating')}</>
                  ) : (
                    <>🚀 {t('ai.generateBtn')}</>
                  )}
                </button>
              </div>

              {/* API Key Warning */}
              {!config.apiKey && provider !== 'ollama' && (
                <div
                  style={{
                    backgroundColor: '#fff3cd',
                    border: '1px solid #ffeeba',
                    padding: '12px',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    fontSize: '13px'
                  }}
                >
                  ⚠️ {t('ai.noApiKeyWarning')}{' '}
                  <button
                    onClick={() => setActiveTab('settings')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#007bff',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      padding: 0,
                      fontSize: '13px'
                    }}
                  >
                    {t('ai.goToSettings')}
                  </button>
                </div>
              )}

              {/* Error */}
              {error && (
                <div
                  style={{
                    backgroundColor: '#f8d7da',
                    border: '1px solid #f5c6cb',
                    padding: '12px',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    color: '#721c24'
                  }}
                >
                  ❌ {error}
                </div>
              )}

              {/* Preview */}
              {preview && (
                <div
                  style={{
                    backgroundColor: '#d4edda',
                    border: '1px solid #c3e6cb',
                    padding: '16px',
                    borderRadius: '8px',
                    marginBottom: '16px'
                  }}
                >
                  <h3
                    style={{ margin: '0 0 12px 0', color: '#155724' }}
                  >
                    ✅ {t('ai.previewTitle')}
                  </h3>
                  <pre
                    style={{
                      whiteSpace: 'pre-wrap',
                      fontSize: '13px',
                      margin: 0,
                      fontFamily: 'inherit',
                      color: '#155724'
                    }}
                  >
                    {preview}
                  </pre>
                  <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                    <button
                      onClick={handleApplyGenerated}
                      style={{
                        padding: '10px 20px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      ✅ {t('ai.applyBtn')}
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('schema');
                      }}
                      style={{
                        padding: '10px 20px',
                        fontSize: '14px',
                        backgroundColor: '#17a2b8',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      📝 {t('ai.editJSON')}
                    </button>
                    <button
                      onClick={handleGenerate}
                      style={{
                        padding: '10px 20px',
                        fontSize: '14px',
                        backgroundColor: '#ffc107',
                        color: '#333',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      🔄 {t('ai.regenerateBtn')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* JSON Schema Tab */}
          {activeTab === 'schema' && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    fontWeight: 'bold',
                    marginBottom: '8px'
                  }}
                >
                  {t('ai.jsonInputLabel')}
                </label>
                <p
                  style={{
                    fontSize: '13px',
                    color: '#666',
                    marginBottom: '12px'
                  }}
                >
                  {t('ai.jsonInputHint')}
                </p>
                <textarea
                  value={jsonInput}
                  onChange={(e) => {
                    setJsonInput(e.target.value);
                    setJsonError(null);
                  }}
                  placeholder={JSON.stringify(
                    {
                      t: 'My Architecture',
                      i: [
                        ['Web App', 'desktop', 'User-facing UI'],
                        ['API Server', 'server', 'Core API service'],
                        ['Database', 'storage', 'Primary data store']
                      ],
                      v: [
                        [
                          [
                            [0, -4, 0],
                            [1, 0, 0],
                            [2, 4, 0]
                          ],
                          [
                            [0, 1],
                            [1, 2]
                          ]
                        ]
                      ],
                      _: { f: 'compact', v: '1.0' }
                    },
                    null,
                    2
                  )}
                  rows={20}
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '13px',
                    borderRadius: '8px',
                    border: `1px solid ${jsonError ? '#dc3545' : '#ddd'}`,
                    resize: 'vertical',
                    fontFamily: 'monospace',
                    boxSizing: 'border-box',
                    lineHeight: '1.4'
                  }}
                />
              </div>

              {jsonError && (
                <div
                  style={{
                    backgroundColor: '#f8d7da',
                    border: '1px solid #f5c6cb',
                    padding: '12px',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    color: '#721c24',
                    fontSize: '13px'
                  }}
                >
                  ❌ {jsonError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleApplyJSON}
                  disabled={!jsonInput.trim()}
                  style={{
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    backgroundColor: jsonInput.trim()
                      ? '#28a745'
                      : '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: jsonInput.trim() ? 'pointer' : 'not-allowed'
                  }}
                >
                  ✅ {t('ai.applyJSONBtn')}
                </button>
                <button
                  onClick={() => {
                    try {
                      const formatted = JSON.stringify(
                        JSON.parse(jsonInput),
                        null,
                        2
                      );
                      setJsonInput(formatted);
                      setJsonError(null);
                    } catch (err: any) {
                      setJsonError(err.message);
                    }
                  }}
                  disabled={!jsonInput.trim()}
                  style={{
                    padding: '10px 20px',
                    fontSize: '14px',
                    backgroundColor: '#17a2b8',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: jsonInput.trim() ? 'pointer' : 'not-allowed'
                  }}
                >
                  🔧 {t('ai.formatJSON')}
                </button>
              </div>

              {/* Available Icons Reference */}
              <div
                style={{
                  marginTop: '24px',
                  padding: '16px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  border: '1px solid #e9ecef'
                }}
              >
                <h4 style={{ margin: '0 0 12px 0' }}>
                  📦 {t('ai.availableIcons')}
                </h4>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px'
                  }}
                >
                  {AVAILABLE_ICONS.map((icon) => (
                    <span
                      key={icon.id}
                      title={icon.description}
                      style={{
                        padding: '3px 8px',
                        fontSize: '11px',
                        backgroundColor: '#e9ecef',
                        borderRadius: '4px',
                        fontFamily: 'monospace'
                      }}
                    >
                      {icon.id}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div>
              {/* Provider Selection */}
              <div style={{ marginBottom: '20px' }}>
                <label
                  style={{
                    display: 'block',
                    fontWeight: 'bold',
                    marginBottom: '8px'
                  }}
                >
                  {t('ai.providerLabel')}
                </label>
                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap'
                  }}
                >
                  {[
                    { key: 'openai', label: 'OpenAI', icon: '🟢' },
                    { key: 'deepseek', label: 'DeepSeek', icon: '🔵' },
                    { key: 'ollama', label: 'Ollama (Local)', icon: '🏠' },
                    { key: 'custom', label: t('ai.customProvider'), icon: '⚙️' }
                  ].map((p) => (
                    <button
                      key={p.key}
                      onClick={() => handleProviderChange(p.key)}
                      style={{
                        padding: '10px 16px',
                        fontSize: '14px',
                        backgroundColor:
                          provider === p.key ? '#007bff' : '#f8f9fa',
                        color: provider === p.key ? 'white' : '#333',
                        border: `1px solid ${provider === p.key ? '#007bff' : '#ddd'}`,
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                    >
                      {p.icon} {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* API Endpoint */}
              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    fontWeight: 'bold',
                    marginBottom: '6px'
                  }}
                >
                  {t('ai.apiEndpoint')}
                </label>
                <input
                  type="text"
                  value={config.apiEndpoint}
                  onChange={(e) =>
                    handleConfigChange({ apiEndpoint: e.target.value })
                  }
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '14px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    boxSizing: 'border-box',
                    fontFamily: 'monospace'
                  }}
                />
              </div>

              {/* API Key */}
              {provider !== 'ollama' && (
                <div style={{ marginBottom: '16px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontWeight: 'bold',
                      marginBottom: '6px'
                    }}
                  >
                    {t('ai.apiKey')}
                  </label>
                  <input
                    type="password"
                    value={config.apiKey}
                    onChange={(e) =>
                      handleConfigChange({ apiKey: e.target.value })
                    }
                    placeholder={t('ai.apiKeyPlaceholder')}
                    style={{
                      width: '100%',
                      padding: '10px',
                      fontSize: '14px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      boxSizing: 'border-box'
                    }}
                  />
                  <small style={{ color: '#888' }}>
                    🔒 {t('ai.apiKeyNote')}
                  </small>
                </div>
              )}

              {/* Model */}
              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    fontWeight: 'bold',
                    marginBottom: '6px'
                  }}
                >
                  {t('ai.model')}
                </label>
                <input
                  type="text"
                  value={config.model}
                  onChange={(e) =>
                    handleConfigChange({ model: e.target.value })
                  }
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '14px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Temperature */}
              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    fontWeight: 'bold',
                    marginBottom: '6px'
                  }}
                >
                  {t('ai.temperature')}: {config.temperature}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={config.temperature}
                  onChange={(e) =>
                    handleConfigChange({
                      temperature: parseFloat(e.target.value)
                    })
                  }
                  style={{ width: '100%' }}
                />
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                    color: '#888'
                  }}
                >
                  <span>{t('ai.tempPrecise')}</span>
                  <span>{t('ai.tempCreative')}</span>
                </div>
              </div>

              {/* Max Tokens */}
              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    fontWeight: 'bold',
                    marginBottom: '6px'
                  }}
                >
                  {t('ai.maxTokens')}
                </label>
                <input
                  type="number"
                  value={config.maxTokens}
                  onChange={(e) =>
                    handleConfigChange({
                      maxTokens: parseInt(e.target.value) || 4096
                    })
                  }
                  min={1024}
                  max={32768}
                  style={{
                    width: '200px',
                    padding: '10px',
                    fontSize: '14px',
                    borderRadius: '6px',
                    border: '1px solid #ddd'
                  }}
                />
              </div>

              {/* Config saved info */}
              <div
                style={{
                  backgroundColor: '#d1ecf1',
                  border: '1px solid #bee5eb',
                  padding: '12px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: '#0c5460'
                }}
              >
                💾 {t('ai.configSavedNote')}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

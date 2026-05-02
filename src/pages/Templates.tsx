import { SUPPORT_TEMPLATES } from "../data/templates";
import { Card } from "../components/Card";

export function Templates() {
  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Tier 2 templates</p>
          <h1>Reusable structures for common support workflows.</h1>
          <p>Use these templates as input guidance when creating a new note summary.</p>
        </div>
      </header>

      <div className="template-grid">
        {SUPPORT_TEMPLATES.map((template, index) => (
          <Card title={template.name} eyebrow={`Template ${index + 1}`} key={template.id}>
            <p>{template.description}</p>
            <h3>Fields that matter</h3>
            <ul className="check-list">
              {template.fields.map((field) => <li key={field}>{field}</li>)}
            </ul>
            <h3>Example output structure</h3>
            <p className="template-output">{template.outputStructure}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

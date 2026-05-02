import { Card } from "../components/Card";

const articles = [
  {
    title: "Triage an order workflow failure",
    category: "Order Management",
    steps: [
      "Confirm scope and customer impact.",
      "Check submitted order event and workflow execution logs.",
      "Compare affected records with last successful record.",
      "Capture evidence before escalation."
    ]
  },
  {
    title: "Handle saved search permission errors",
    category: "Reporting",
    steps: [
      "Confirm user role and subsidiary restrictions.",
      "Compare permissions with a known working user.",
      "Check whether the saved search uses audience restrictions.",
      "Document whether the issue is access design or product behavior."
    ]
  },
  {
    title: "Prepare an engineering handoff",
    category: "Escalation",
    steps: [
      "Include case number, account, environment, product, and priority.",
      "Write expected versus actual behavior.",
      "Attach reproduction steps, logs, IDs, and screenshots.",
      "List what support has already ruled out."
    ]
  }
];

export function Knowledge() {
  return (
    <div className="page-stack console-page">
      <header className="console-header">
        <div>
          <p className="eyebrow">Knowledge</p>
          <h1>Support playbooks</h1>
          <p>Use these lightweight playbooks to practice ticket investigation and handoff habits.</p>
        </div>
      </header>

      <div className="knowledge-grid">
        {articles.map((article) => (
          <Card title={article.title} eyebrow={article.category} key={article.title}>
            <ol className="numbered-list">
              {article.steps.map((step) => <li key={step}>{step}</li>)}
            </ol>
          </Card>
        ))}
      </div>
    </div>
  );
}

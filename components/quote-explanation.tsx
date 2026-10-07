import type { ClientExplanation } from '@/lib/domain';

export default function QuoteExplanation({ explanation }: { explanation: ClientExplanation }) {
  return <div className="quote-explanation">
    <h3>Why this is additional work</h3>
    <p className="quote-message">{explanation.message}</p>
    {explanation.references.length > 0 && <details>
      <summary>Supporting agreement clauses</summary>
      {explanation.references.map(clause => <div className="reference" key={clause.id}>
        <span className="clause-id">{clause.id}</span><p>{clause.text}</p>
      </div>)}
    </details>}
  </div>;
}

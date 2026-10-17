/** Fixed, synthetic documentation patch. Never reads real family data. */
import {prepareBuilderPatch} from "./builder-patch.mjs";
export function createSafeProposal(){
 const finding={code:"spark_research_note"};
 const content="# Spark design research: pending review\n\nAutomated research proposals must include a source, accessibility review, iPhone test, and human approval. This draft is synthetic and does not claim research was conducted.\n";
 return prepareBuilderPatch({finding,files:[{path:"docs/spark-design-research.md",content}]});
}

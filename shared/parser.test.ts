import { describe, test, expect } from "bun:test";
import { parse, serialize, nextId } from "./parser";
import type { Board, SectionName } from "./types";

const SAMPLE = `# My Project

> repository: https://github.com/user/repo
> created: 2026-04-01
> updated: 2026-04-05

## TODO

- [ ] **Implement auth** \`#id-001\` \`priority:high\` \`label:backend\`
  Add OAuth2 support for GitHub login.

- [ ] **Write tests** \`#id-002\` \`label:testing\`
  Unit tests for the parser module.

## IN_PROGRESS

- [-] **Build UI** \`#id-003\` \`priority:high\` \`label:frontend\`
  React components for the kanban board.
  - [x] Layout component
  - [ ] Card component

## DONE

- [x] **Setup project** \`#id-004\` \`priority:low\`
  Scaffolded with Electrobun.

## CANCELLED

- [~] **Add GraphQL** \`#id-005\` \`priority:low\`
  Decided REST is sufficient.
`;

describe("parser", () => {
  test("parses project name", () => {
    const board = parse(SAMPLE);
    expect(board.projectName).toBe("My Project");
  });

  test("parses metadata", () => {
    const board = parse(SAMPLE);
    expect(board.metadata.repository).toBe("https://github.com/user/repo");
    expect(board.metadata.created).toBe("2026-04-01");
    expect(board.metadata.updated).toBe("2026-04-05");
  });

  test("parses TODO tasks", () => {
    const board = parse(SAMPLE);
    expect(board.sections.TODO).toHaveLength(2);

    const t1 = board.sections.TODO[0];
    expect(t1.id).toBe("id-001");
    expect(t1.title).toBe("Implement auth");
    expect(t1.priority).toBe("high");
    expect(t1.labels).toEqual(["backend"]);
    expect(t1.description).toBe("Add OAuth2 support for GitHub login.");
  });

  test("parses default priority as medium", () => {
    const board = parse(SAMPLE);
    const t2 = board.sections.TODO[1];
    expect(t2.priority).toBe("medium");
  });

  test("parses IN_PROGRESS with subtasks", () => {
    const board = parse(SAMPLE);
    expect(board.sections.IN_PROGRESS).toHaveLength(1);

    const t = board.sections.IN_PROGRESS[0];
    expect(t.id).toBe("id-003");
    expect(t.subtasks).toHaveLength(2);
    expect(t.subtasks[0]).toEqual({ done: true, title: "Layout component" });
    expect(t.subtasks[1]).toEqual({ done: false, title: "Card component" });
  });

  test("parses DONE section", () => {
    const board = parse(SAMPLE);
    expect(board.sections.DONE).toHaveLength(1);
    expect(board.sections.DONE[0].id).toBe("id-004");
    expect(board.sections.DONE[0].priority).toBe("low");
  });

  test("parses CANCELLED section", () => {
    const board = parse(SAMPLE);
    expect(board.sections.CANCELLED).toHaveLength(1);
    expect(board.sections.CANCELLED[0].id).toBe("id-005");
  });

  test("handles empty file", () => {
    const board = parse("");
    expect(board.projectName).toBe("");
    for (const section of ["TODO", "IN_PROGRESS", "DONE", "CANCELLED"] as SectionName[]) {
      expect(board.sections[section]).toEqual([]);
    }
  });

  test("handles file with only project name", () => {
    const board = parse("# Solo Project\n");
    expect(board.projectName).toBe("Solo Project");
  });

  test("handles tasks without description", () => {
    const md = `# P

## TODO

- [ ] **Quick task** \`#id-001\`

## IN_PROGRESS

## DONE

## CANCELLED
`;
    const board = parse(md);
    expect(board.sections.TODO[0].description).toBe("");
  });

  test("handles tasks without ID (auto-generates)", () => {
    const md = `# P

## TODO

- [ ] **No ID task**
- [ ] **Another** \`#id-005\`
- [ ] **Third no ID**

## IN_PROGRESS

## DONE

## CANCELLED
`;
    const board = parse(md);
    expect(board.sections.TODO[0].id).toBe("id-006");
    expect(board.sections.TODO[1].id).toBe("id-005");
    expect(board.sections.TODO[2].id).toBe("id-007");
  });

  test("handles multiple labels", () => {
    const md = `# P

## TODO

- [ ] **Multi label** \`#id-001\` \`label:frontend\` \`label:urgent\` \`label:v2\`

## IN_PROGRESS

## DONE

## CANCELLED
`;
    const board = parse(md);
    expect(board.sections.TODO[0].labels).toEqual([
      "frontend",
      "urgent",
      "v2",
    ]);
  });
});

describe("serializer", () => {
  test("round-trips a board", () => {
    const board = parse(SAMPLE);
    const output = serialize(board);
    const reparsed = parse(output);

    expect(reparsed.projectName).toBe(board.projectName);
    expect(reparsed.metadata.repository).toBe(board.metadata.repository);
    expect(reparsed.metadata.created).toBe(board.metadata.created);

    for (const section of ["TODO", "IN_PROGRESS", "DONE", "CANCELLED"] as SectionName[]) {
      expect(reparsed.sections[section].length).toBe(
        board.sections[section].length
      );
      for (let i = 0; i < board.sections[section].length; i++) {
        const orig = board.sections[section][i];
        const rt = reparsed.sections[section][i];
        expect(rt.id).toBe(orig.id);
        expect(rt.title).toBe(orig.title);
        expect(rt.priority).toBe(orig.priority);
        expect(rt.labels).toEqual(orig.labels);
        expect(rt.subtasks).toEqual(orig.subtasks);
      }
    }
  });

  test("serializes medium priority without tag", () => {
    const board = parse(SAMPLE);
    const output = serialize(board);
    // id-002 has medium priority - should not have priority tag
    expect(output).toContain("**Write tests** `#id-002`");
    expect(output).not.toContain("priority:medium");
  });

  test("serializes non-medium priority with tag", () => {
    const board = parse(SAMPLE);
    const output = serialize(board);
    expect(output).toContain("`priority:high`");
    expect(output).toContain("`priority:low`");
  });
});

describe("nextId", () => {
  test("returns next sequential ID", () => {
    const board = parse(SAMPLE);
    expect(nextId(board)).toBe("id-006");
  });

  test("returns id-001 for empty board", () => {
    const board = parse("# Empty\n\n## TODO\n\n## IN_PROGRESS\n\n## DONE\n\n## CANCELLED\n");
    expect(nextId(board)).toBe("id-001");
  });
});

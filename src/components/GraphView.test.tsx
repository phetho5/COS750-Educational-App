import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { dijkstra, SAMPLE_GRAPH } from "../engine";
import { layoutById } from "../questions";
import { DistanceTable } from "./DistanceTable";
import { edgeKey, pathEdges, statesFrom, vertexLabel } from "./graphHelpers";
import { GraphView } from "./GraphView";

const sample = layoutById("sample");
const finalTable = dijkstra(SAMPLE_GRAPH, "A").finalTable;

describe("graph helpers", () => {
  it("names undirected edges the same both ways, and directed edges by direction", () => {
    expect(edgeKey("B", "A")).toBe("A-B");
    expect(edgeKey("A", "B")).toBe("A-B");
    expect(edgeKey("B", "A", true)).toBe("B>A");
  });

  it("finds the shortest-path edges from the previous column", () => {
    const keys = pathEdges(finalTable)
      .map(([a, b]) => edgeKey(a, b))
      .sort();
    expect(keys).toEqual(["A-D", "B-D", "B-F", "C-D", "C-E"]);
    expect(pathEdges(null)).toEqual([]);
  });

  it("works out vertex states, with current winning over visited", () => {
    expect(statesFrom(["A", "B", "C", "D"], ["A", "B"], "B", "C")).toEqual({
      A: "visited",
      B: "current",
      C: "selected",
      D: "unvisited",
    });
  });

  it("says infinity in words for screen readers", () => {
    expect(vertexLabel("E", "unvisited", Infinity)).toBe(
      "Vertex E, unvisited, distance infinity",
    );
    expect(vertexLabel("B", "visited", 3)).toBe(
      "Vertex B, visited, distance 3",
    );
    expect(vertexLabel("B", "current", undefined)).toBe("Vertex B, current");
  });
});

describe("GraphView", () => {
  function drawSample(extra: Partial<Parameters<typeof GraphView>[0]> = {}) {
    return render(
      <GraphView
        graph={SAMPLE_GRAPH}
        wide={sample.wide}
        narrow={sample.narrow}
        label="Sample graph"
        {...extra}
      />,
    );
  }

  it("marks candidate and currently checked vertices as distinct states", () => {
    expect(
      statesFrom(["A", "B", "C"], ["A"], null, null, ["B", "C"], "B"),
    ).toEqual({
      A: "visited",
      B: "checking",
      C: "candidate",
    });
    expect(vertexLabel("C", "candidate", 4)).toBe(
      "Vertex C, candidate, distance 4",
    );
    expect(vertexLabel("B", "checking", 3)).toBe(
      "Vertex B, checking, distance 3",
    );
  });
  it("draws every vertex and every edge weight", () => {
    const { container } = drawSample();
    expect(container.querySelectorAll("circle[data-state]")).toHaveLength(6);
    for (const edge of SAMPLE_GRAPH.edges)
      expect(screen.getAllByText(String(edge.weight)).length).toBeGreaterThan(
        0,
      );
  });

  it("marks visited vertices with a tick, not just a colour", () => {
    const { container } = drawSample({
      states: { A: "visited", B: "current" },
    });
    expect(container.querySelectorAll('[data-badge="tick"]')).toHaveLength(1);
    expect(container.querySelector('circle[data-state="current"]')).toHaveStyle(
      { strokeWidth: "4" },
    );
  });

  it("gives candidate vertices a dashed outline and the active check a solid outline", () => {
    const { container } = drawSample({
      states: { B: "candidate", C: "checking" },
    });
    expect(
      container.querySelector('circle[data-state="candidate"]'),
    ).toHaveStyle({ strokeDasharray: "5 3" });
    expect(
      container.querySelector('circle[data-state="checking"]'),
    ).toHaveStyle({ strokeWidth: "3.5" });
  });

  it("draws the edge being checked as a dashed line", () => {
    const { container } = drawSample({ checkingEdge: ["D", "B"] });
    const dashed = [...container.querySelectorAll("line")].filter(
      (l) => l.style.strokeDasharray === "12 8",
    );
    expect(dashed).toHaveLength(1);
  });

  it("shows distance labels with ∞", () => {
    drawSample({ distances: { A: 0, B: Infinity } });
    expect(screen.getByText("d = ∞")).toBeInTheDocument();
    expect(screen.getByText("d = 0")).toBeInTheDocument();
  });

  it("lets the student select vertices with the mouse or the keyboard, only the selectable ones", async () => {
    const onVertex = vi.fn();
    drawSample({ onVertex, selectable: ["B", "D"], distances: { B: 3, D: 2 } });
    expect(screen.getAllByRole("button")).toHaveLength(2);

    await userEvent.click(
      screen.getByRole("button", { name: "Vertex B, unvisited, distance 3" }),
    );
    expect(onVertex).toHaveBeenLastCalledWith("B");

    screen.getByRole("button", { name: /Vertex D/ }).focus();
    await userEvent.keyboard("{Enter}");
    expect(onVertex).toHaveBeenLastCalledWith("D");
  });

  it("lets the student select edges when asked to", async () => {
    const onEdge = vi.fn();
    drawSample({ onEdge });
    await userEvent.click(
      screen.getByRole("button", { name: "Edge F-C, weight 3" }),
    );
    expect(onEdge).toHaveBeenCalledWith(["F", "C"]);
  });
});

describe("DistanceTable", () => {
  const visitD = dijkstra(SAMPLE_GRAPH, "A").steps.find(
    (step) => step.kind === "visit" && step.vertex === "D",
  )!;

  it("shows distances, previous vertices (None for the start) and visited", () => {
    render(
      <DistanceTable
        table={finalTable}
        vertices={SAMPLE_GRAPH.vertices}
        showVisited
        caption="Distance table"
      />,
    );
    const rowA = screen.getByRole("row", { name: /^A/ });
    expect(rowA).toHaveTextContent("A0NoneYes");
    expect(screen.getByRole("row", { name: /^E/ })).toHaveTextContent(
      "E12CYes",
    );
  });

  it("labels candidate, checked and updated vertices in the table", () => {
    const { rerender } = render(
      <DistanceTable
        table={visitD.table}
        vertices={SAMPLE_GRAPH.vertices}
        showVisited
        candidates={["B", "C"]}
        checking="B"
      />,
    );
    expect(screen.getByRole("row", { name: /^B/ })).toHaveTextContent(
      "Checking",
    );
    expect(screen.getByRole("row", { name: /^C/ })).toHaveTextContent(
      "Candidate",
    );

    rerender(
      <DistanceTable
        table={
          dijkstra(SAMPLE_GRAPH, "A").steps.find(
            (step) =>
              step.kind === "check-edge" &&
              step.vertex === "D" &&
              step.neighbour === "B",
          )!.table
        }
        vertices={SAMPLE_GRAPH.vertices}
        showVisited
        changed={{ B: 4 }}
        candidates={["B", "C"]}
        checking="B"
      />,
    );
    expect(screen.getByRole("row", { name: /^B/ })).toHaveTextContent(
      "Updated",
    );
  });

  it('shows a changed distance with the old one struck through, read out as "was"', () => {
    render(
      <DistanceTable table={finalTable} vertices={["B"]} changed={{ B: 4 }} />,
    );
    expect(screen.getByRole("row", { name: /^B/ })).toHaveTextContent(
      "B3was 4D",
    );
  });

  it("turns a cell into a labelled input when it is editable", async () => {
    const onChange = vi.fn();
    render(
      <DistanceTable
        table={finalTable}
        vertices={["F"]}
        editable={{ F: { value: "", onChange, ariaLabel: "Distance for F" } }}
      />,
    );
    await userEvent.type(screen.getByLabelText("Distance for F"), "8");
    expect(onChange).toHaveBeenCalledWith("8");
  });
});

import { useCallback, useRef, useState } from "react";
import type { ElementPositions } from "@/lib/types";

export function useDragAndDrop(svgRef: React.RefObject<SVGSVGElement | null>) {
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);

  // Get SVG point from mouse event
  const getSVGPoint = useCallback((event: MouseEvent | React.MouseEvent) => {
    if (!svgRef.current) return null;
    const svg = svgRef.current;
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const svgPoint = point.matrixTransform(svg.getScreenCTM()?.inverse());
    return svgPoint;
  }, [svgRef]);

  const startDrag = useCallback((elementId: string, event: React.MouseEvent, currentPositions: ElementPositions) => {
    event.preventDefault();
    const svgPoint = getSVGPoint(event);
    if (!svgPoint) return;

    const elementPos = currentPositions[elementId as keyof ElementPositions] as { x: number; y: number };
    if (!elementPos) return;

    setDragging(elementId);
    setDragOffset({
      x: svgPoint.x - elementPos.x,
      y: svgPoint.y - elementPos.y,
    });
  }, [getSVGPoint]);

  const handleMouseMove = useCallback((event: MouseEvent, positions: ElementPositions, onPositionChange: (elementId: string, x: number, y: number) => void) => {
    if (!dragging || !dragOffset) return;

    const svgPoint = getSVGPoint(event);
    if (!svgPoint) return;

    const newX = svgPoint.x - dragOffset.x;
    const newY = svgPoint.y - dragOffset.y;

    onPositionChange(dragging, newX, newY);
  }, [dragging, dragOffset, getSVGPoint]);

  const stopDrag = useCallback(() => {
    setDragging(null);
    setDragOffset(null);
  }, []);

  return {
    dragging,
    dragOffset,
    startDrag,
    handleMouseMove,
    stopDrag,
  };
}

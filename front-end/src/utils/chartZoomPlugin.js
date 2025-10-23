/**
 * Custom Chart.js plugin for mouse wheel zooming and drag panning
 * Provides zoom and pan functionality without external dependencies
 */

export const chartZoomPlugin = {
  id: 'customZoom',

  defaults: {
    enabled: true,
    zoomSpeed: 0.1,
    minZoomRange: 20, // Minimum number of data points to show (for category/time scales)
    maxZoomLevel: 10, // Maximum zoom in multiplier relative to full range
    modifierKey: 'shift', // Key to hold for Y-axis zoom
    enableDrag: true, // Enable drag to pan
  },

  beforeInit(chart, args, options) {
    // Store plugin state
    chart.zoomPlugin = {
      originalScaleLimits: {},
      dataBounds: {},
      options: { ...this.defaults, ...options },
      isDragging: false,
      dragStartX: null,
      dragStartY: null,
      initialMinX: null,
      initialMaxX: null,
      initialMinY: null,
      initialMaxY: null,
    };
  },

  afterInit(chart) {
    const canvas = chart.canvas;
    const plugin = chart.zoomPlugin;

    storeOriginalLimits(chart);
    updateDataBounds(chart);

    // Add wheel event listener for zoom
    const handleWheel = (event) => {
      if (!plugin.options.enabled) return;

      // Check if mouse is over the chart area
      const rect = canvas.getBoundingClientRect();
      const chartArea = chart.chartArea;
      if (!chartArea) return;

      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      if (x < chartArea.left || x > chartArea.right || y < chartArea.top || y > chartArea.bottom) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const zoomSpeed = plugin.options.zoomSpeed;
      const delta = event.deltaY < 0 ? (1 - zoomSpeed) : (1 + zoomSpeed);

      // Determine which axis to zoom
      const zoomY = shouldZoomY(event, plugin.options.modifierKey);
      const relativeX = x - chartArea.left;
      const relativeY = y - chartArea.top;
      const width = chartArea.right - chartArea.left;
      const height = chartArea.bottom - chartArea.top;

      if (zoomY && chart.scales.y) {
        // Zoom Y axis
        zoomAxis(chart, 'y', delta, relativeY, height);
      } else if (chart.scales.x) {
        // Zoom X axis
        zoomAxis(chart, 'x', delta, relativeX, width);
      }

      chart.update('none'); // Update without animation
    };

    // Add mouse event listeners for drag panning
    const handleMouseDown = (event) => {
      if (!plugin.options.enabled || !plugin.options.enableDrag) return;

      const rect = canvas.getBoundingClientRect();
      const chartArea = chart.chartArea;
      if (!chartArea) return;

      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      if (x < chartArea.left || x > chartArea.right || y < chartArea.top || y > chartArea.bottom) {
        return;
      }

      plugin.isDragging = true;
      plugin.dragStartX = event.clientX;
      plugin.dragStartY = event.clientY;

      // Store initial scale values
      if (chart.scales.x) {
        plugin.initialMinX = getCurrentScaleMin(chart.scales.x);
        plugin.initialMaxX = getCurrentScaleMax(chart.scales.x);
      }
      if (chart.scales.y) {
        plugin.initialMinY = getCurrentScaleMin(chart.scales.y);
        plugin.initialMaxY = getCurrentScaleMax(chart.scales.y);
      }

      // Change cursor
      canvas.style.cursor = 'grabbing';
      event.preventDefault();
      event.stopPropagation();
    };

    const handleMouseMove = (event) => {
      if (!plugin.isDragging) return;

      const deltaX = event.clientX - plugin.dragStartX;
      const deltaY = event.clientY - plugin.dragStartY;

      const rect = canvas.getBoundingClientRect();
      const chartArea = chart.chartArea;
      if (!chartArea) return;
      const width = chartArea.right - chartArea.left;
      const height = chartArea.bottom - chartArea.top;
      const boundsX = plugin.dataBounds.x;
      const boundsY = plugin.dataBounds.y;

      // Pan X axis
      if (chart.scales.x && Math.abs(deltaX) > 0) {
        const scale = chart.scales.x;
        const dataRange = plugin.initialMaxX - plugin.initialMinX;
        const pixelToValue = dataRange / width;
        const shift = -deltaX * pixelToValue;

        const newMin = plugin.initialMinX + shift;
        const newMax = plugin.initialMaxX + shift;

        // Get data boundaries
        const dataMin = boundsX ? boundsX.min : null;
        const dataMax = boundsX ? boundsX.max : null;

        // Apply boundaries
        if (dataMin !== null && dataMax !== null) {
          if (newMin >= dataMin && newMax <= dataMax) {
            scale.options.min = newMin;
            scale.options.max = newMax;
          } else if (newMin < dataMin) {
            scale.options.min = dataMin;
            scale.options.max = dataMin + dataRange;
          } else if (newMax > dataMax) {
            scale.options.min = dataMax - dataRange;
            scale.options.max = dataMax;
          }
        } else {
          scale.options.min = newMin;
          scale.options.max = newMax;
        }
      }

      // Pan Y axis (if shift is held)
      if (chart.scales.y && event.shiftKey && Math.abs(deltaY) > 0) {
        const scale = chart.scales.y;
        const dataRange = plugin.initialMaxY - plugin.initialMinY;
        const pixelToValue = dataRange / height;
        const shift = deltaY * pixelToValue; // Y is inverted

        const newMin = plugin.initialMinY + shift;
        const newMax = plugin.initialMaxY + shift;

        // Get data boundaries
        const dataMin = boundsY ? boundsY.min : null;
        const dataMax = boundsY ? boundsY.max : null;

        // Apply boundaries
        if (dataMin !== null && dataMax !== null) {
          if (newMin >= dataMin && newMax <= dataMax) {
            scale.options.min = newMin;
            scale.options.max = newMax;
          } else if (newMin < dataMin) {
            scale.options.min = dataMin;
            scale.options.max = dataMin + dataRange;
          } else if (newMax > dataMax) {
            scale.options.min = dataMax - dataRange;
            scale.options.max = dataMax;
          }
        } else {
          scale.options.min = newMin;
          scale.options.max = newMax;
        }
      }

      chart.update('none');
      event.preventDefault();
      event.stopPropagation();
    };

    const handleMouseUp = (event) => {
      if (plugin.isDragging) {
        plugin.isDragging = false;
        canvas.style.cursor = 'grab';
        event.preventDefault();
        event.stopPropagation();
      }
    };

    const handleMouseEnter = (event) => {
      if (!plugin.isDragging && plugin.options.enableDrag) {
        canvas.style.cursor = 'grab';
      }
    };

    const handleMouseLeave = (event) => {
      canvas.style.cursor = 'default';
      if (plugin.isDragging) {
        plugin.isDragging = false;
      }
    };

    // Attach event listeners
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseenter', handleMouseEnter);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    // Global mouseup for when mouse leaves canvas while dragging
    document.addEventListener('mouseup', handleMouseUp);

    // Store references for cleanup
    plugin.handlers = {
      wheel: handleWheel,
      mousedown: handleMouseDown,
      mousemove: handleMouseMove,
      mouseup: handleMouseUp,
      mouseenter: handleMouseEnter,
      mouseleave: handleMouseLeave,
      globalMouseup: handleMouseUp
    };
  },

  beforeDestroy(chart) {
    // Clean up event listeners
    if (chart.zoomPlugin && chart.zoomPlugin.handlers) {
      const canvas = chart.canvas;
      canvas.style.cursor = 'default';
      const handlers = chart.zoomPlugin.handlers;

      canvas.removeEventListener('wheel', handlers.wheel);
      canvas.removeEventListener('mousedown', handlers.mousedown);
      canvas.removeEventListener('mousemove', handlers.mousemove);
      canvas.removeEventListener('mouseup', handlers.mouseup);
      canvas.removeEventListener('mouseenter', handlers.mouseenter);
      canvas.removeEventListener('mouseleave', handlers.mouseleave);
      document.removeEventListener('mouseup', handlers.globalMouseup);
    }
  },

  afterUpdate(chart) {
    if (!chart.zoomPlugin) return;
    updateDataBounds(chart);
    // Refresh original limits when fully reset (no custom min/max applied)
    ['x', 'y'].forEach(axis => {
      const scale = chart.scales[axis];
      if (!scale) return;
      if (scale.options.min === undefined && scale.options.max === undefined) {
        chart.zoomPlugin.originalScaleLimits[axis] = {
          min: scale.min,
          max: scale.max
        };
      }
    });
  }
};

function shouldZoomY(event, modifierKey = 'shift') {
  if (!modifierKey) return false;
  const key = modifierKey.toLowerCase();
  if (key === 'shift') return event.shiftKey || event.ctrlKey;
  if (key === 'ctrl' || key === 'control') return event.ctrlKey;
  if (key === 'alt') return event.altKey;
  if (key === 'meta') return event.metaKey;
  return false;
}

/**
 * Store initial scale limits
 */
function storeOriginalLimits(chart) {
  const plugin = chart.zoomPlugin;
  if (!plugin) return;
  ['x', 'y'].forEach(axis => {
    const scale = chart.scales[axis];
    if (!scale) return;
    plugin.originalScaleLimits[axis] = {
      min: scale.min,
      max: scale.max
    };
  });
}

/**
 * Compute data bounds for each axis
 */
function updateDataBounds(chart) {
  const plugin = chart.zoomPlugin;
  if (!plugin) return;

  plugin.dataBounds = plugin.dataBounds || {};

  const xScale = chart.scales.x;
  if (xScale) {
    plugin.dataBounds.x = calculateAxisBounds(chart, xScale, 'x');
  }

  const yScale = chart.scales.y;
  if (yScale) {
    plugin.dataBounds.y = calculateAxisBounds(chart, yScale, 'y');
  }
}

function calculateAxisBounds(chart, scale, axis) {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;

  chart.data.datasets.forEach(dataset => {
    if (!dataset?.data) return;
    dataset.data.forEach(point => {
      const value = extractValue(point, axis);
      if (value === null) return;
      if (value < min) min = value;
      if (value > max) max = value;
    });
  });

  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    if (axis === 'x') {
      const labels = chart.data.labels || [];
      if (scale.type === 'category') {
        const labelCount = labels.length;
        return {
          min: 0,
          max: labelCount > 0 ? labelCount - 1 : 0
        };
      }
      const labelValues = labels
        .map(label => toNumeric(label))
        .filter(value => value !== null);
      if (labelValues.length) {
        min = Math.min(...labelValues);
        max = Math.max(...labelValues);
      }
    } else {
      // For Y axis fall back to scale limits
      min = getCurrentScaleMin(scale);
      max = getCurrentScaleMax(scale);
    }
  }

  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return null;
  }

  return { min, max };
}

function extractValue(point, axis) {
  if (point === null || point === undefined) return null;
  if (typeof point === 'number') {
    return axis === 'y' ? point : null;
  }
  if (typeof point === 'object') {
    if (Array.isArray(point)) {
      const idx = axis === 'x' ? 0 : 1;
      return toNumeric(point[idx]);
    }
    if (axis === 'x' && ('x' in point || 't' in point)) {
      return toNumeric(point.x ?? point.t);
    }
    if (axis === 'y' && ('y' in point || 'value' in point)) {
      return toNumeric(point.y ?? point.value);
    }
  }
  return null;
}

function toNumeric(value) {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string') {
    const numeric = Number(value);
    if (!Number.isNaN(numeric)) return numeric;
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (typeof value.valueOf === 'function') {
    const primitive = value.valueOf();
    return typeof primitive === 'number' && Number.isFinite(primitive) ? primitive : null;
  }
  return null;
}

function getCurrentScaleMin(scale) {
  return scale.options.min !== undefined ? scale.options.min : scale.min;
}

function getCurrentScaleMax(scale) {
  return scale.options.max !== undefined ? scale.options.max : scale.max;
}

/**
 * Zoom a specific axis
 */
function zoomAxis(chart, axisName, delta, mousePos, canvasSize) {
  const scale = chart.scales[axisName];
  if (!scale) return;

  const plugin = chart.zoomPlugin;
  const options = plugin.options;
  const bounds = plugin.dataBounds[axisName];

  // Get current range
  let currentMin = getCurrentScaleMin(scale);
  let currentMax = getCurrentScaleMax(scale);

  // For category scales (like time labels), work with indices
  if (scale.type === 'category') {
    const labels = chart.data.labels;
    if (!labels || labels.length === 0) return;

    // Convert current view to indices
    if (currentMin === undefined) currentMin = 0;
    if (currentMax === undefined) currentMax = labels.length - 1;

    // Calculate zoom center as index
    const currentRange = currentMax - currentMin;
    const centerRatio = axisName === 'x' ? mousePos / canvasSize : 1 - (mousePos / canvasSize);
    const centerIndex = currentMin + currentRange * centerRatio;

    // Calculate new range
    const newRange = currentRange * delta;

    // Check constraints
    if (newRange < options.minZoomRange) return; // Too zoomed in
    if (newRange > labels.length) { // Too zoomed out
      scale.options.min = 0;
      scale.options.max = labels.length - 1;
      return;
    }

    // Calculate new bounds centered on mouse position
    const halfRange = newRange / 2;
    let newMin = Math.round(centerIndex - halfRange);
    let newMax = Math.round(centerIndex + halfRange);

    // Ensure bounds are within data
    if (bounds) {
      const dataMin = bounds.min;
      const dataMax = bounds.max;
      if (newMin < dataMin) {
        newMin = dataMin;
        newMax = Math.min(dataMin + newRange, dataMax);
      }
      if (newMax > dataMax) {
        newMax = dataMax;
        newMin = Math.max(dataMin, dataMax - newRange);
      }
    } else {
      if (newMin < 0) {
        newMin = 0;
        newMax = Math.min(newRange, labels.length - 1);
      }
      if (newMax >= labels.length) {
        newMax = labels.length - 1;
        newMin = Math.max(0, newMax - newRange);
      }
    }

    scale.options.min = newMin;
    scale.options.max = newMax;

  } else {
    // For linear scales (like price)

    // Calculate the mouse position value
    const posRatio = axisName === 'y'
      ? 1 - (mousePos / canvasSize)
      : mousePos / canvasSize;
    const centerValue = currentMin + (currentMax - currentMin) * posRatio;

    // Calculate new limits centered on mouse position
    const leftRange = centerValue - currentMin;
    const rightRange = currentMax - centerValue;

    let newMin = centerValue - leftRange * delta;
    let newMax = centerValue + rightRange * delta;

    // Check zoom constraints
    const newRange = newMax - newMin;
    const dataRange = bounds ? bounds.max - bounds.min : currentMax - currentMin;

    // Estimate minimum range based on data spacing for time scales
    let minRange = dataRange / options.maxZoomLevel;
    if (scale.type === 'time' && plugin.dataBounds.x) {
      const labels = chart.data.labels || [];
      if (labels.length > 1) {
        const first = toNumeric(labels[0]);
        const second = toNumeric(labels[1]);
        if (first !== null && second !== null) {
          const avgSpacing = Math.abs(second - first) || 1;
          minRange = Math.max(minRange, avgSpacing * options.minZoomRange);
        }
      }
    }

    // Don't zoom in too much
    if (newRange < minRange) {
      return;
    }

    // Don't zoom out beyond data
    if (bounds) {
      if (newMin < bounds.min) newMin = bounds.min;
      if (newMax > bounds.max) newMax = bounds.max;
    }

    scale.options.min = newMin;
    scale.options.max = newMax;
  }
}

/**
 * Reset zoom to original view
 */
export function resetZoom(chart) {
  if (!chart.zoomPlugin) return;

  const originalLimits = chart.zoomPlugin.originalScaleLimits;

  if (chart.scales.x) {
    if (originalLimits.x) {
      chart.scales.x.options.min = originalLimits.x.min;
      chart.scales.x.options.max = originalLimits.x.max;
    } else {
      delete chart.scales.x.options.min;
      delete chart.scales.x.options.max;
    }
  }

  if (chart.scales.y) {
    if (originalLimits.y) {
      chart.scales.y.options.min = originalLimits.y.min;
      chart.scales.y.options.max = originalLimits.y.max;
    } else {
      delete chart.scales.y.options.min;
      delete chart.scales.y.options.max;
    }
  }

  chart.update('none');
}

/**
 * Pan the chart
 */
export function panChart(chart, direction, amount = 0.1) {
  if (!chart.scales.x) return;

  const scale = chart.scales.x;
  const plugin = chart.zoomPlugin;
  const bounds = plugin?.dataBounds?.x;

  // Get current view range
  const currentMin = getCurrentScaleMin(scale);
  const currentMax = getCurrentScaleMax(scale);
  const range = currentMax - currentMin;

  // Calculate shift amount
  const shift = range * amount * (direction === 'left' ? -1 : 1);

  // For category scales
  if (scale.type === 'category') {
    const labels = chart.data.labels;
    if (!labels) return;

    const newMin = currentMin + shift;
    const newMax = currentMax + shift;
    const dataMin = bounds ? bounds.min : 0;
    const dataMax = bounds ? bounds.max : labels.length - 1;

    // Check boundaries
    if (newMin >= dataMin && newMax <= dataMax) {
      scale.options.min = Math.round(newMin);
      scale.options.max = Math.round(newMax);
      chart.update('none');
    } else if (newMin < dataMin) {
      scale.options.min = dataMin;
      scale.options.max = Math.round(dataMin + range);
      chart.update('none');
    } else if (newMax > dataMax) {
      scale.options.min = Math.round(dataMax - range);
      scale.options.max = dataMax;
      chart.update('none');
    }
  } else {
    // For linear scales
    const dataMin = bounds ? bounds.min : getCurrentScaleMin(scale);
    const dataMax = bounds ? bounds.max : getCurrentScaleMax(scale);

    const newMin = currentMin + shift;
    const newMax = currentMax + shift;

    // Check boundaries
    if (newMin >= dataMin && newMax <= dataMax) {
      scale.options.min = newMin;
      scale.options.max = newMax;
      chart.update('none');
    } else if (newMin < dataMin) {
      scale.options.min = dataMin;
      scale.options.max = dataMin + range;
      chart.update('none');
    } else if (newMax > dataMax) {
      scale.options.min = dataMax - range;
      scale.options.max = dataMax;
      chart.update('none');
    }
  }
}

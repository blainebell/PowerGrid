const React = require('react');
// TODO: this probably needs to change per browser.  Probably should auto calculate.
const SCROLLBAR_SIZE = 15;

let getStarts = (sizes) => {
  let starts = [];
  let start = 0;
  sizes.forEach((size, n) => {
    starts[n] = start;
    start += size;
  });

  return starts;
}

let getCellIndex = (col, row, numCols) => {
  // e.g. 3*5
  // 0  1  2
  // 3  4  5 
  // 6  7  8
  // 9  10 11
  // 12 13 14

  return (row * numCols) + col;
};

let getCellRect = (gridMeta, col, row) => {
  return {
    x: gridMeta.colStarts[col],
    y: gridMeta.rowStarts[row],
    width: gridMeta.colWidths[col],
    height: gridMeta.rowHeights[row]
  };
};

let getCellMeta = (viewModel, gridMeta, cell) => {
  let gridX = gridMeta.x;
  let gridY = gridMeta.y;
  let gridWidth = viewModel.width;
  let gridHeight = viewModel.height;
  let cellViewModel = cell.viewModel;
  let x = gridMeta.colStarts[cellViewModel.col];
  let y = gridMeta.rowStarts[cellViewModel.row];
  let width = gridMeta.colWidths[cellViewModel.col];
  let height = gridMeta.rowHeights[cellViewModel.row];
  let visible = x + width >= gridX && x <= gridX + gridWidth && y + height >= gridY && y - height <= gridY + gridHeight;

  return {
    visible: visible,
    // direction of cell relative to center of grid
    direction: {
      x: x > gridX + gridWidth/2 ? -1 : 1,
      y: y > gridY + gridHeight/2 ? -1 : 1
    }
  }
};

let getStartCell = (viewModel, gridMeta) => {
  // find cell near center;
  let numCols = gridMeta.colWidths.length;
  let numRows = gridMeta.rowHeights.length;
  let col = Math.floor(numCols/2);
  let row = Math.floor(numRows/2);
  let cellIndex = getCellIndex(col, row, numCols);
  let startCell = viewModel.cells[cellIndex];
  let startCellMeta = getCellMeta(viewModel, gridMeta, startCell);
  let divider = 0.25;
  let bisectorCount = 0;
  
  while (!startCellMeta.visible) {
    let direction = startCellMeta.direction;

    if (direction.x > 0) {
      col += Math.floor(numCols*divider);
    }
    else if (direction.x < 0) {
      col -= Math.floor(numCols*divider);
    }

    if (direction.y > 0) {
      row += Math.floor(numRows*divider);
    }
    else if (direction.y < 0) {
      row -= Math.floor(numRows*divider);
    }

    cellIndex = getCellIndex(col, row, numCols);
    
    startCell = viewModel.cells[cellIndex];
    startCellMeta = getCellMeta(viewModel, gridMeta, startCell);
    divider /= 2;
    bisectorCount++;
  }

  //console.log('found visible cell in ' + bisectorCount + ' iterations');

  return startCell;
}

let getViewportCells = (viewModel, gridMeta) => {
  let viewportCells = [];
  let numCols = gridMeta.colWidths.length;
  let numRows = gridMeta.rowHeights.length;
  let startCell = getStartCell(viewModel, gridMeta);
  let startCol = startCell.viewModel.col;
  let startRow = startCell.viewModel.row;
  let minCol = startCol;
  let maxCol = startCol;
  let minRow = startRow;
  let maxRow = startRow;

  viewportCells.push(startCell); 

  while (true) {
    minCol--;
    if (minCol < 0) {
      minCol = 0;
      break;
    }
    let cellIndex = getCellIndex(minCol, startRow, numCols);
    let cell = viewModel.cells[cellIndex];
    cellMeta = getCellMeta(viewModel, gridMeta, cell);
    if (!cellMeta.visible) {
      break;
    }
  }

  while (true) {
    maxCol++;
    if (maxCol >= numCols-1) {
      maxCol = numCols-1;
      break;
    }
    let cellIndex = getCellIndex(maxCol, startRow, numCols);
    let cell = viewModel.cells[cellIndex];
    cellMeta = getCellMeta(viewModel, gridMeta, cell);
    if (!cellMeta.visible) {
      break;
    }
  }

  while (true) {
    minRow--;
    if (minRow < 0) {
      minRow = 0;
      break;
    }
    let cellIndex = getCellIndex(startCol, minRow, numCols);
    let cell = viewModel.cells[cellIndex];
    cellMeta = getCellMeta(viewModel, gridMeta, cell);
    if (!cellMeta.visible) {
      break;
    }
  }

  while (true) {
    maxRow++;
    if (maxRow >= numRows-1) {
      maxRow = numRows-1;
      break;
    }
    let cellIndex = getCellIndex(startCol, maxRow, numCols);
    let cell = viewModel.cells[cellIndex];
    cellMeta = getCellMeta(viewModel, gridMeta, cell);
    if (!cellMeta.visible) {
      break;
    }
  }

  for (let r=minRow; r<=maxRow; r++) {
    for (let c=minCol; c<=maxCol; c++) {
      let cellIndex = getCellIndex(c, r, numCols);
      let cell = viewModel.cells[cellIndex];
      
      viewportCells.push(cell);
    }
  }

  //console.log('rendering ' + viewportCells.length + '/' + viewModel.cells.length + ' cells');

  return viewportCells;
};

let getGridMeta = (viewModel) => {
  let colWidths = viewModel.colWidths;
  let rowHeights = viewModel.rowHeights;
  let colStarts = getStarts(colWidths);
  let rowStarts = getStarts(rowHeights);
  let innerWidth = colStarts[colStarts.length-1] + colWidths[colWidths.length-1];
  let innerHeight = rowStarts[rowStarts.length-1] + rowHeights[rowHeights.length-1];
  let x = viewModel.x;
  let y = viewModel.y;

  return {
    x: x,
    y: y,
    colWidths: colWidths,
    rowHeights: rowHeights,
    colStarts: colStarts,
    rowStarts: rowStarts,
    innerWidth: innerWidth,
    innerHeight: innerHeight
  };
};

class PowerGrid extends React.Component {
  constructor() {
    super();
    this.mainGridRef = React.createRef();
    this.shadowGridRef = React.createRef();
    let that = this;
    let dirty = false;

    let update = () => {
      if (dirty) {
        that.forceUpdate();
        dirty = false;
      }
      requestAnimationFrame(() => {
        update();
      });
    };

    document.addEventListener('scroll', (evt) => {
      let powerGridEl = evt.target.closest('.power-grid');
      
      if (powerGridEl === that.mainGridRef.current) {
        let viewModel = that.props.viewModel;
        let shadowGridEl = evt.target.closest('.power-grid-shadow');
        viewModel.x = shadowGridEl.scrollLeft;
        viewModel.y = shadowGridEl.scrollTop;

        if (that.props.onViewModelUpdate) {
          that.props.onViewModelUpdate();
        }
        dirty = true;
      }
    }, true); // scroll does not bubble, must listen on capture


    document.addEventListener('wheel', (evt) => {
      let powerGridEl = evt.target.closest('.power-grid');
      let that = this;
      
      if (powerGridEl === that.mainGridRef.current) {
        let viewModel = that.props.viewModel;
        let gridMeta = that.cachedGridMeta;
        let minX = 0;
        let minY = 0;
        let maxX = gridMeta.innerWidth - viewModel.width + SCROLLBAR_SIZE;
        let maxY = gridMeta.innerHeight - viewModel.height + SCROLLBAR_SIZE;
        viewModel.x += evt.deltaX;
        viewModel.y += evt.deltaY;

        if (viewModel.x < minX) {
          viewModel.x = minX;
        }
        else if (viewModel.x > maxX) {
          viewModel.x = maxX;
        }

        if (viewModel.y < minY) {
          viewModel.y = minY;
        }
        else if (viewModel.y > maxY) {
          viewModel.y = maxY;
        }

        if (that.props.onViewModelUpdate) {
          that.props.onViewModelUpdate();
        }
        dirty = true;
      }
    }, true); // scroll does not bubble, must listen on capture

    update();
  }

  componentDidUpdate() {
    let viewModel = this.props.viewModel;
    let shadowGridEl = this.shadowGridRef.current;
    shadowGridEl.scrollLeft = viewModel.x;
    shadowGridEl.scrollTop = viewModel.y;
  }

  render() {
    let props = this.props;
    let viewModel = props.viewModel;
    let gridMeta = getGridMeta(viewModel);

    this.cachedGridMeta = gridMeta;

    let viewportCells = getViewportCells(viewModel, gridMeta);

    let backgroundCells = [];

    viewportCells.forEach((cell, i) => {
      let cellViewModel = cell.viewModel;
      let cellRect = getCellRect(gridMeta, cellViewModel.col, cellViewModel.row);
      let x = cellRect.x - gridMeta.x;
      let y = cellRect.y - gridMeta.y;
      let width = cellRect.width;
      let height = cellRect.height;

      let innerCell = React.createElement(cell.renderer, {
        key: i + '-inner',
        viewModel: cellViewModel,
        onClick: props.onCellClick
      }, []);

      let outerCell = React.createElement('td', {
        key: i + '-outer',
        className: 'power-grid-cell',
        style: {
          transform: 'translate(' + x + 'px ,' +  y + 'px)',
          width: width + 'px',
          height: height + 'px'
        }
      }, [innerCell])

      backgroundCells.push(outerCell);
    });

    let backgroundGridWidth = viewModel.width;
    if (!viewModel.hideScrollbars) {
      backgroundGridWidth -= SCROLLBAR_SIZE;
    }

    let backgroundGridHeight = viewModel.height;
    if (!viewModel.hideScrollbars) {
      backgroundGridHeight -= SCROLLBAR_SIZE;
    }

    return(
      <div className={'power-grid' + (viewModel.hideScrollbars ? ' hide-scrollbars' : '')} ref={this.mainGridRef} style={{width: viewModel.width + 'px', height: viewModel.height + 'px'}}>
        <div className="power-grid-shadow" ref={this.shadowGridRef} style={{width: viewModel.width + 'px', height: viewModel.height + 'px'}}>
          <div className="power-grid-shadow-content" style={{width: gridMeta.innerWidth + 'px',height: gridMeta.innerHeight + 'px'}}>
          </div>
        </div>
        <table className="power-grid-background-grid" style={{width: backgroundGridWidth + 'px', height: backgroundGridHeight + 'px'}}>
          {backgroundCells}
        </table>
      </div>
    )
  }
}

module.exports = PowerGrid;
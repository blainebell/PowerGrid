# Power Grid

## Features
* blazing fast performance and massive scale (100M cells+) via virtualized viewport
* React interface
* completely customizable cells via JSX and CSS
* cell interactivity
* expand / collapse rows and columns
* merged cells support (colspans and rowspans)
* dynamic row heights and column widths
* native scroll bars
* any number of fixed rows and headers
* screen reader accessible via semantic table html

## React Cell JSX Example (MyCell)


```JSX
import React from 'react';
import { css } from 'emotion';

const TextCell = (props) => {
  let viewModel = props.viewModel;

  let styles = css`
    background-color: #eee;

    &.bad {
      background-color: #ffc7ce;
      color: #9c0006;
    }

    &.neutral {
      background-color: #ffeb9c;
      color: #9c5700;
    }

    &.good {
      background-color: #c6efce;
      color: #267c27;
    }

    &:hover {
      background-color: #b0d9fe;
    }
  `;

  return (
    <td className={'power-grid-cell power-grid-text-cell ' + viewModel.rating + ' ' + styles} onClick={props.onClick} data-row={props.row} style={{transform: 'translate(' + props.x + 'px,' + props.y + 'px)', width: (props.width-2)+'px', height: props.height+'px'}}>
      {viewModel.value}
    </td>
  )
};

export default TextCell;
```

## View Model Example 

```javascript
let viewModel = {
  hideScrollbars: false,
  maxCellsWhileScrolling: 1000,
  x: 0,
  y: 0,
  width: 200,
  height: 100,
  colWidths: [100, 120],
  rowHeights: [80, 60],
  // row based.  array of rows, and each row is an array of cells
  cells: [
    [
      {
        renderer: MyCell,
        viewModel: {
          value: 5,
          rating: 'good'
        }
      },
      {
        renderer: MyCell,
        viewModel: {
          value: 5,
          rating: 'good'
        }
      }
    ],
    [
      {
        renderer: MyCell,
        viewModel: {
          value: 5,
          rating: 'good'
        }
      },
      {
        renderer: MyCell,
        viewModel: {
          value: 2,
          rating: 'bad'
        }
      }
    ]
  ]
}
```

## Usage App Example

```JSX
<PowerGrid viewModel={viewModel} onViewModelUpdate={onViewModelUpdate} onCellClick={onCellClick}/>
```


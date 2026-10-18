# Offline Markdown Viewer Test

## Table

| Component | Role |
|---|---|
| FastAPI | API layer |
| Model server | Inference |

## Mermaid diagram

```mermaid
flowchart LR
  A[Client] --> B[FastAPI]
  B --> C[Model Server]
  C --> D[Prediction]
```

## Math

Inline: $E = mc^2$

Display:

$$
\nabla \cdot E = \frac{\rho}{\epsilon_0}
$$

## Python

```python
def predict(features):
    return model.predict(features)
```

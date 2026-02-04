---
tags:
- setfit
- sentence-transformers
- text-classification
- generated_from_setfit_trainer
widget:
- text: OI FIBRA INTERNET
- text: COMGÁS BOLETO
- text: DROGARIA ONOFRE
- text: DECOLAR COM VIAGENS
- text: NETFLIX COM ASSINATURA
metrics:
- accuracy
pipeline_tag: text-classification
library_name: setfit
inference: true
base_model: sentence-transformers/paraphrase-multilingual-mpnet-base-v2
model-index:
- name: SetFit with sentence-transformers/paraphrase-multilingual-mpnet-base-v2
  results:
  - task:
      type: text-classification
      name: Text Classification
    dataset:
      name: Unknown
      type: unknown
      split: test
    metrics:
    - type: accuracy
      value: 0.6666666666666666
      name: Accuracy
---

# SetFit with sentence-transformers/paraphrase-multilingual-mpnet-base-v2

This is a [SetFit](https://github.com/huggingface/setfit) model that can be used for Text Classification. This SetFit model uses [sentence-transformers/paraphrase-multilingual-mpnet-base-v2](https://huggingface.co/sentence-transformers/paraphrase-multilingual-mpnet-base-v2) as the Sentence Transformer embedding model. A [LogisticRegression](https://scikit-learn.org/stable/modules/generated/sklearn.linear_model.LogisticRegression.html) instance is used for classification.

The model has been trained using an efficient few-shot learning technique that involves:

1. Fine-tuning a [Sentence Transformer](https://www.sbert.net) with contrastive learning.
2. Training a classification head with features from the fine-tuned Sentence Transformer.

## Model Details

### Model Description
- **Model Type:** SetFit
- **Sentence Transformer body:** [sentence-transformers/paraphrase-multilingual-mpnet-base-v2](https://huggingface.co/sentence-transformers/paraphrase-multilingual-mpnet-base-v2)
- **Classification head:** a [LogisticRegression](https://scikit-learn.org/stable/modules/generated/sklearn.linear_model.LogisticRegression.html) instance
- **Maximum Sequence Length:** 128 tokens
- **Number of Classes:** 6 classes
<!-- - **Training Dataset:** [Unknown](https://huggingface.co/datasets/unknown) -->
<!-- - **Language:** Unknown -->
<!-- - **License:** Unknown -->

### Model Sources

- **Repository:** [SetFit on GitHub](https://github.com/huggingface/setfit)
- **Paper:** [Efficient Few-Shot Learning Without Prompts](https://arxiv.org/abs/2209.11055)
- **Blogpost:** [SetFit: Efficient Few-Shot Learning Without Prompts](https://huggingface.co/blog/setfit)

### Model Labels
| Label       | Examples                                                                                                  |
|:------------|:----------------------------------------------------------------------------------------------------------|
| Transporte  | <ul><li>'PEDÁGIO ECOVIA'</li><li>'WIZZER PASSAGENS'</li><li>'CORREIOS SEDEX'</li></ul>                    |
| Mercado     | <ul><li>'CHILLI BEANS ÓCULOS'</li><li>'CASAS BAHIA VAREJO'</li><li>'TELHANORTE PISOS'</li></ul>           |
| Alimentacao | <ul><li>'OUTBACK STEAKHOUSE'</li><li>'IFOOD *PEDIDO ONLINE'</li><li>'SYMPLA EVENTOS'</li></ul>            |
| Assinaturas | <ul><li>'VIVO MOVEL CELULAR'</li><li>'CLARO NET COMBO'</li><li>'HOTMART CURSOS'</li></ul>                 |
| Saude       | <ul><li>'COLEGIO INFANTIL'</li><li>'DROGARIA SAO PAULO DIST'</li><li>'Farmácia Araujo'</li></ul>          |
| Combustivel | <ul><li>'POSTO IPIRANGA MATRIZ'</li><li>'GASOLINA ADITIVADA V-POWER'</li><li>'POSTO BR ALEGRIA'</li></ul> |

## Evaluation

### Metrics
| Label   | Accuracy |
|:--------|:---------|
| **all** | 0.6667   |

## Uses

### Direct Use for Inference

First install the SetFit library:

```bash
pip install setfit
```

Then you can load this model and run inference.

```python
from setfit import SetFitModel

# Download from the 🤗 Hub
model = SetFitModel.from_pretrained("setfit_model_id")
# Run inference
preds = model("COMGÁS BOLETO")
```

<!--
### Downstream Use

*List how someone could finetune this model on their own dataset.*
-->

<!--
### Out-of-Scope Use

*List how the model may foreseeably be misused and address what users ought not to do with the model.*
-->

<!--
## Bias, Risks and Limitations

*What are the known or foreseeable issues stemming from this model? You could also flag here known failure cases or weaknesses of the model.*
-->

<!--
### Recommendations

*What are recommendations with respect to the foreseeable issues? For example, filtering explicit content.*
-->

## Training Details

### Training Set Metrics
| Training set | Min | Median | Max |
|:-------------|:----|:-------|:----|
| Word count   | 2   | 2.6635 | 4   |

| Label       | Training Sample Count |
|:------------|:----------------------|
| Alimentacao | 17                    |
| Assinaturas | 20                    |
| Combustivel | 5                     |
| Mercado     | 29                    |
| Saude       | 17                    |
| Transporte  | 16                    |

### Training Hyperparameters
- batch_size: (16, 16)
- num_epochs: (1, 1)
- max_steps: -1
- sampling_strategy: oversampling
- num_iterations: 20
- body_learning_rate: (2e-05, 2e-05)
- head_learning_rate: 2e-05
- loss: CosineSimilarityLoss
- distance_metric: cosine_distance
- margin: 0.25
- end_to_end: False
- use_amp: False
- warmup_proportion: 0.1
- l2_weight: 0.01
- seed: 42
- eval_max_steps: -1
- load_best_model_at_end: False

### Training Results
| Epoch  | Step | Training Loss | Validation Loss |
|:------:|:----:|:-------------:|:---------------:|
| 0.0038 | 1    | 0.3472        | -               |
| 0.1923 | 50   | 0.2074        | -               |
| 0.3846 | 100  | 0.0808        | -               |
| 0.5769 | 150  | 0.0235        | -               |
| 0.7692 | 200  | 0.0022        | -               |
| 0.9615 | 250  | 0.0035        | -               |

### Framework Versions
- Python: 3.14.2
- SetFit: 1.1.3
- Sentence Transformers: 5.2.0
- Transformers: 4.57.6
- PyTorch: 2.9.1+cpu
- Datasets: 4.5.0
- Tokenizers: 0.22.2

## Citation

### BibTeX
```bibtex
@article{https://doi.org/10.48550/arxiv.2209.11055,
    doi = {10.48550/ARXIV.2209.11055},
    url = {https://arxiv.org/abs/2209.11055},
    author = {Tunstall, Lewis and Reimers, Nils and Jo, Unso Eun Seo and Bates, Luke and Korat, Daniel and Wasserblat, Moshe and Pereg, Oren},
    keywords = {Computation and Language (cs.CL), FOS: Computer and information sciences, FOS: Computer and information sciences},
    title = {Efficient Few-Shot Learning Without Prompts},
    publisher = {arXiv},
    year = {2022},
    copyright = {Creative Commons Attribution 4.0 International}
}
```

<!--
## Glossary

*Clearly define terms in order to be accessible across audiences.*
-->

<!--
## Model Card Authors

*Lists the people who create the model card, providing recognition and accountability for the detailed work that goes into its construction.*
-->

<!--
## Model Card Contact

*Provides a way for people who have updates to the Model Card, suggestions, or questions, to contact the Model Card authors.*
-->
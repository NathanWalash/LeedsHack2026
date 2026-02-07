import streamlit as st

st.title("Train & Forecast")

st.subheader("Model Settings")
horizon = st.selectbox("Forecast horizon (weeks)", [4, 8, 12])
train_split = st.slider("Train/Test split", min_value=0.6, max_value=0.9, value=0.8)
baseline = st.selectbox("Baseline model", ["Prophet", "ARIMA", "MovingAvg"])
multivariate = st.selectbox("Multivariate model", ["RandomForest", "XGBoost"])

st.subheader("Run")
col1, col2, col3 = st.columns(3)
with col1:
    st.button("Run Baseline")
with col2:
    st.button("Run Multivariate")
with col3:
    st.button("Compare")

st.subheader("Results")
st.info("Stub: plots + metrics + explainability")

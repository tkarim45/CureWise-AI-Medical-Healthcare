# @app.post("/api/medical-query")
# async def medical_query(
#     query: Optional[str] = Form(None),
#     file: Optional[UploadFile] = File(None),
#     current_user: dict = Depends(get_current_user),
#     request: Request = None,
# ):
#     """Process blood report and/or answer query using public API."""
#     try:
#         form_data = await request.form()
#         logger.info(
#             f"Received medical query for user: {current_user['user_id']}, raw_query: {query!r}, file: {file.filename if file else None}, form_data: {dict(form_data)}"
#         )

#         json_output = None
#         response = None

#         if file:
#             file_path = f"uploads/{current_user['user_id']}_{file.filename}"
#             logger.info(f"Saving file: {file_path}")
#             os.makedirs("uploads", exist_ok=True)
#             with open(file_path, "wb") as f:
#                 f.write(await file.read())
#             report_text = await parse_blood_report(file_path)
#             json_output, _ = await structure_report(report_text)
#             os.remove(file_path)
#             logger.info(f"File processed and deleted: {file_path}")

#             effective_query = (
#                 query.strip() if query else "Explain my blood test results"
#             )
#             logger.info(f"Effective query for file upload: {effective_query}")
#         else:
#             if query is None or query.strip() == "":
#                 logger.error("No query provided for follow-up question")
#                 raise HTTPException(
#                     status_code=400,
#                     detail="A non-empty query is required when no file is uploaded.",
#                 )

#             history = get_chat_history(current_user["user_id"])
#             if history and any(h["report_json"] for h in history):
#                 logger.info(
#                     f"Retrieving stored report for user: {current_user['user_id']}"
#                 )
#                 json_output = json.loads(history[-1]["report_json"])
#             else:
#                 logger.info("No stored report, proceeding with query only")
#                 json_output = None

#             effective_query = query.strip()
#             logger.info(f"Effective query for follow-up: {effective_query}")

#         prompt = f"""
# You are a friendly medical AI assistant who explains blood test results and answers medical questions in simple, kind words for non-experts. Follow these guidelines:
# 1. Keep answers 100-150 words, clear, and focused.
# 2. Use analogies (e.g., "Red blood cells are like trucks carrying oxygen") and avoid jargon.
# 3. Suggest 1-2 next steps (e.g., "Talk to your doctor about iron supplements").
# 4. Highlight urgency (e.g., "If you feel dizzy, go now").
# 5. Note this is not a diagnosis and recommend consulting a doctor.
# 6. Output only the answer text, without labels like "assistant:" or code blocks.

# Current Query: {effective_query}
# """
#         if json_output:
#             patient_age = json_output.get("patient_info", {}).get("age", "Unknown")
#             patient_gender = json_output.get("patient_info", {}).get(
#                 "gender", "Unknown"
#             )
#             prompt += f"""
# Patient Age: {patient_age}
# Patient Gender: {patient_gender}
# Blood Test Results (JSON):
# {json.dumps(json_output, indent=2)}
# """
#         else:
#             prompt += "\nNo blood test results available."

#         logger.info(f"Sending prompt to public API: {prompt[:100]}...")
#         api_response = requests.post(
#             settings.PUBLIC_API_URL, json={"prompt": prompt, "max_new_tokens": 300}
#         )
#         api_response.raise_for_status()
#         response_data = api_response.json()

#         if "error" in response_data:
#             logger.error(f"Public API error: {response_data['error']}")
#             raise HTTPException(
#                 status_code=500, detail=f"Public API error: {response_data['error']}"
#             )

#         raw_response = response_data.get("generated_text")
#         if not raw_response:
#             logger.error("No generated_text in public API response")
#             raise HTTPException(
#                 status_code=500, detail="No generated_text in public API response"
#             )

#         cleaned_response = raw_response.strip()
#         cleaned_response = re.sub(
#             r"^(assistant:|[\[\{]?(ANSWER|RESPONSE)[\]\}]?:?\s*)",
#             "",
#             cleaned_response,
#             flags=re.IGNORECASE,
#         )
#         cleaned_response = re.sub(
#             r"```(?:json)?\s*(.*?)\s*```", r"\1", cleaned_response, flags=re.DOTALL
#         )
#         cleaned_response = re.sub(r"\s*(</s>|[EOT]|\[.*?\])$", "", cleaned_response)
#         if not cleaned_response.strip():
#             logger.error("Cleaned response is empty")
#             raise HTTPException(status_code=500, detail="Cleaned response is empty")

#         response = cleaned_response.strip()
#         logger.info(f"Parsed public API response: {response[:100]}...")

#         store_chat_history(
#             user_id=current_user["user_id"],
#             query=effective_query,
#             report_json=json.dumps(json_output) if json_output else "",
#             response=response,
#         )

#         logger.info("Query processed successfully")
#         return {"structured_report": json_output, "response": response}
#     except requests.RequestException as e:
#         logger.error(f"Public API request failed: {str(e)}")
#         raise HTTPException(
#             status_code=500, detail=f"Public API request failed: {str(e)}"
#         )
#     except Exception as e:
#         logger.error(f"Error processing query: {str(e)}")
#         raise HTTPException(status_code=500, detail=f"Error processing query: {str(e)}")

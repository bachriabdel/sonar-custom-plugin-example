/*
 * Copyright (C) 2009-2020 SonarSource SA
 * mailto:info AT sonarsource DOT com
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program; if not, write to the Free Software Foundation,
 * Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */
// SonarRequest (referenced as sonar-request here, see the Webpack config)
// Exposes helpers for managing API requests.
import { getJSON } from "sonar-request";

export function findQualityProfilesStatistics(project) {
  return getJSON("/api/qualityprofiles/search").then(function(response) {
    return response.profiles.length;
  });
}

export function findQualityQatesStatistics(project) {
  return getJSON("/api/qualitygates/list").then(function(response) {
    return response.qualitygates.length;
  });
}

export function findIssuesStatistics(project) {
  return getJSON("/api/issues/search").then(function(response) {
    return response.total;
  });
}

export function findProjects(project) {
  return getJSON("/api/projects/search").then(function(response) {
    return response.components.length;
  });
}

function buildResultForAnalysis(measures, analysisDate) {
  const result = {
    alert_status: "",
    bugs: "0",
    vulnerabilities: "0",
    sqale_index: "0",
    reliability_rating: "",
    security_rating: "",
    sqale_rating: ""
  };
  for (const measure of measures) {
    for (const entry of measure.history) {
      if (entry.date === analysisDate && measure.metric in result) {
        result[measure.metric] = entry.value;
      }
    }
  }
  return result;
}

export function findVersionsAndMeasures(project) {
  return getJSON("/api/project_analyses/search", {
    project: project.key,
    p: 1,
    ps: 500
  }).then(function(responseAnalyses) {
    const numberOfAnalyses = responseAnalyses.analyses.length;
    if (numberOfAnalyses > 0) {
      return getJSON("/api/measures/search_history", {
        component: project.key,
        metrics: "alert_status,bugs,vulnerabilities,sqale_index,reliability_rating,security_rating,sqale_rating",
        ps: 50
      }).then(function(responseMetrics) {
        const data = [];
        for (const analysis of responseAnalyses.analyses) {
          data.push(buildResultForAnalysis(responseMetrics.measures, analysis.date));
        }
        return data;
      });
    }
  });
}
